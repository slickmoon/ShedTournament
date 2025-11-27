from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, select
from datetime import datetime, timedelta, timezone
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

        elo, matches_in_season = PlayerService.calculate_player_season_data(player, current_season, db)
        # Build a new dict of the player object without the elo field
        player_dict = {c.name: getattr(player, c.name) for c in player.__table__.columns if c.name != 'elo'}
         # append the elo field
        player_dict['elo'] = elo
        player_dict['matches_in_season'] = matches_in_season
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
            elo, matches_in_season = PlayerService.calculate_player_season_data(player, current_season, db)
            result.append({
                "id": player.id,
                "player_name": player.player_name,
                "elo": elo,
                "total_matches": total_matches or 0,
                "recently_pantsed": recently_pantsed,
                "matches_in_season": matches_in_season
            })
        return result
    
    @staticmethod
    def get_current_season(season_id, db: Session):
        # Return lifetime data for all seasons
        if season_id == -999:
            return None
        # Initial load return current season
        if season_id == -998:
            now = datetime.now()
            return db.query(base.GameSeason).filter(
                base.GameSeason.start_date <= now,
                base.GameSeason.end_date >= now
            ).order_by(
                (base.GameSeason.start_date).desc()
            ).first()

        # Return specified season
        else:
            return db.query(base.GameSeason).filter(
                base.GameSeason.id == season_id
            ).first()
    
    @staticmethod
    def calculate_player_season_data(player, current_season, db: Session):
        
        
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
            # Exclude matches that belong to special event seasons within the current season
            special_seasons = db.query(base.GameSeason).filter(
                base.GameSeason.id != current_season.id,
                base.GameSeason.start_date >= current_season.start_date,
                base.GameSeason.end_date <= current_season.end_date
            ).all()
            if special_seasons:
                filtered_matches = []
                for match in matches:
                    in_special_season = any(
                        season.start_date <= match.timestamp <= season.end_date
                        for season in special_seasons
                    )
                    if not in_special_season:
                        filtered_matches.append(match)
                matches = filtered_matches
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
        return elo, len(matches)

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
        now = datetime.now(timezone.utc)
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
            time_remaining = PlayerService._format_time_remaining(s.end_date, now)
            seasons.append({
                "id": s.id, 
                "season_name": f"*{s.season_name}*",
                "sort_order": i,
                "season_start_date": f"{s.start_date}",
                "season_end_date": f"{s.end_date}",
                "season_time_remaining": f"Season ends in {time_remaining}"
            })
        # Next season (sort_order: current_seasons count)
        if next_season:
            seasons.append({
                "id": next_season.id, 
                "season_name": next_season.season_name,
                "sort_order": len(current_seasons),
                "season_start_date": f"{next_season.start_date}",
                "season_end_date": f"{next_season.end_date}",
                "season_time_remaining": f"Season starts on {next_season.start_date.strftime('%d/%m/%Y')}"
            })
        # Previous seasons (sort_order: -1, -2, -3, ...)
        for i, s in enumerate(previous_seasons):
            seasons.append({
                "id": s.id, 
                "season_name": s.season_name,
                "sort_order": -(i + 1),
                "season_start_date": f"{s.start_date}",
                "season_end_date": f"{s.end_date}",
                "season_time_remaining": f"Season ended on {s.end_date.strftime('%d/%m/%Y')}"
            })
        
        # Sort the final list by sort_order
        seasons.sort(key=lambda x: x['sort_order'])
            
        return seasons 

    @staticmethod
    def _format_time_remaining(end_date: datetime, now: datetime) -> str:
        """Return a human-readable time remaining string."""
        normalized_end = PlayerService._ensure_timezone(end_date)
        normalized_now = PlayerService._ensure_timezone(now)
        remaining = normalized_end - normalized_now
        if remaining.total_seconds() <= 0:
            return "0 minutes"

        if remaining.days >= 1:
            days = remaining.days
            return f"{days} day{'s' if days != 1 else ''}"

        total_seconds = remaining.seconds
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60

        parts = []
        if hours:
            parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")

        return " ".join(parts)

    @staticmethod
    def _ensure_timezone(dt: datetime) -> datetime:
        """Ensure datetime is timezone-aware in UTC for calculations."""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)