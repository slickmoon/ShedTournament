from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, select
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from .. import base
from ..schemas import PlayerCreate, PlayerUpdate

class PlayerService:
    @staticmethod
    def create_player(db: Session, player: PlayerCreate) -> base.Player:
        db_player = base.Player(player_name=player.player_name)
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
        return db_player

    @staticmethod
    def get_player(db: Session, player_id: int, season_id: int = 0) -> Optional[dict]:
        player = db.query(base.Player).filter(
            base.Player.id == player_id,
            base.Player.deleted == False
        ).first()
        if not player:
            return None
        
        current_season = PlayerService.get_current_season(season_id,db)

        elo = PlayerService.calculate_player_elo(player, current_season, db)
        # Build a new dict of the player object without the elo field
        player_dict = {c.name: getattr(player, c.name) for c in player.__table__.columns if c.name != 'elo'}
         # append the elo field
        player_dict['elo'] = elo
        return player_dict

    @staticmethod
    def get_players(db: Session,season_id) -> list[dict]:
        # Get match counts
        match_counts = db.query(
            base.Player.id,
            func.count(base.Match.id).label('total_matches')
        ).outerjoin(
            base.Match,
            or_(
                base.Match.winner1_id == base.Player.id,
                base.Match.winner2_id == base.Player.id,
                base.Match.loser1_id == base.Player.id,
                base.Match.loser2_id == base.Player.id
            )
        ).group_by(base.Player.id).subquery()

        # Get pantsed event type
        pantsed_event = db.query(base.EventType).filter(base.EventType.name == "pantsed").first()
        
        # Get recent pantsing events (last 90 days)
        pantsed_validity_start_date = datetime.now() - timedelta(days=90)
        recent_pantsed_players = db.query(base.PlayerEvent.player_id).filter(
            base.PlayerEvent.event_id == pantsed_event.id,
            base.PlayerEvent.timestamp >= pantsed_validity_start_date
        ).subquery()

        # Query all players with match counts and pantsed status
        player_rows = db.query(
            base.Player,
            match_counts.c.total_matches,
            base.Player.id.in_(select(recent_pantsed_players)).label('recently_pantsed')
        ).outerjoin(
            match_counts,
            base.Player.id == match_counts.c.id
        ).filter(
            base.Player.deleted == False
        ).order_by(
            base.Player.player_name.asc()
        ).all()

        current_season = PlayerService.get_current_season(season_id, db)

        # For each player, calculate ELO from matches in the current season
        result = []
        for player, total_matches, recently_pantsed in player_rows:
            elo = PlayerService.calculate_player_elo(player, current_season, db)
            result.append({
                "id": player.id,
                "player_name": player.player_name,
                "elo": elo,
                "total_matches": total_matches or 0,
                "recently_pantsed": recently_pantsed
            })
        return result
    
    @staticmethod
    def get_current_season(season_id, db: Session):
        # Return lifetime data for all seasons
        if season_id == -999:
            return None
        # Return specified season
        else:
            return db.query(base.GameSeason).filter(
                base.GameSeason.id == season_id
            ).first()
    
    @staticmethod
    def calculate_player_elo(player, current_season, db: Session):
        elo = base.DEFAULT_ELO
        if current_season:
            matches = db.query(base.Match).filter(
                ((base.Match.winner1_id == player.id) |
                    (base.Match.winner2_id == player.id) |
                    (base.Match.loser1_id == player.id) |
                    (base.Match.loser2_id == player.id)) &
                (base.Match.timestamp >= current_season.start_date) &
                (base.Match.timestamp <= current_season.end_date)
            ).all()
        else:
            matches = db.query(base.Match).filter(
                (base.Match.winner1_id == player.id) |
                (base.Match.winner2_id == player.id) |
                (base.Match.loser1_id == player.id) |
                (base.Match.loser2_id == player.id)
            ).all()
        for match in matches:
            if match.winner1_id == player.id:
                elo += match.winner1_elo_change
            if match.winner2_id == player.id and match.winner2_elo_change is not None:
                elo += match.winner2_elo_change
            if match.loser1_id == player.id:
                elo += match.loser1_elo_change
            if match.loser2_id == player.id and match.loser2_elo_change is not None:
                elo += match.loser2_elo_change
        return elo

    @staticmethod
    def update_player(db: Session, player_id: int, player: PlayerUpdate) -> Optional[base.Player]:
        player = db.query(base.Player).filter(
            base.Player.id == player_id,
            base.Player.deleted == False
        ).first()
        if not player:
            return None
        
        player.player_name = player.player_name
        db.commit()
        db.refresh(player)
        return player

    @staticmethod
    def delete_player(db: Session, player_id: int) -> bool:
        player = db.query(base.Player).filter(
            base.Player.id == player_id,
            base.Player.deleted == False
        ).first()
        if not player:
            return None
        
        player.deleted = True
        player.deleted_at = datetime.now()
        db.commit()
        return True

    @staticmethod
    def get_seasons(db: Session):
        now = datetime.now()
        # Current season
        current_seasons = db.query(base.GameSeason).filter(
            base.GameSeason.start_date <= now,
            base.GameSeason.end_date >= now
        ).order_by(
            (base.GameSeason.end_date - base.GameSeason.start_date).asc()
        ).all()
        # Next season
        next_season = db.query(base.GameSeason).filter(
            base.GameSeason.start_date > now
        ).order_by(base.GameSeason.start_date.asc()).first()
        # Previous seasons
        previous_seasons = db.query(base.GameSeason).filter(
            base.GameSeason.end_date < now
        ).order_by(base.GameSeason.end_date.desc()).all()
        seasons = []
        # Current seasons (sort_order: 0, 1, 2, ...)
        for i, s in enumerate(current_seasons):
            seasons.append({
                "id": s.id, 
                "season_name": f"*{s.season_name}*",
                "sort_order": i
            })
        # Next season (sort_order: current_seasons count)
        if next_season:
            seasons.append({
                "id": next_season.id, 
                "season_name": next_season.season_name,
                "sort_order": len(current_seasons)
            })
        # Previous seasons (sort_order: -1, -2, -3, ...)
        for i, s in enumerate(previous_seasons):
            seasons.append({
                "id": s.id, 
                "season_name": s.season_name,
                "sort_order": -(i + 1)
            })
        
        # Sort the final list by sort_order
        seasons.sort(key=lambda x: x['sort_order'])
            
        return seasons 