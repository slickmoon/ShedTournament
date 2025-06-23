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
    def get_player(db: Session, player_id: int) -> Optional[dict]:
        new_elo_calc = True
        player = db.query(base.Player).filter(
            base.Player.id == player_id,
            base.Player.deleted == False
        ).first()
        if not player:
            return None
        if (new_elo_calc):
            # Calculate ELO from matches
            elo = base.DEFAULT_ELO
            # Get all matches where the player was a winner or loser
            matches = db.query(base.Match).filter(
                (base.Match.winner1_id == player_id) |
                (base.Match.winner2_id == player_id) |
                (base.Match.loser1_id == player_id) |
                (base.Match.loser2_id == player_id)
            ).all()
            for match in matches:
                if match.winner1_id == player_id:
                    elo += match.winner1_elo_change
                if match.winner2_id == player_id and match.winner2_elo_change is not None:
                    elo += match.winner2_elo_change
                if match.loser1_id == player_id:
                    elo += match.loser1_elo_change
                if match.loser2_id == player_id and match.loser2_elo_change is not None:
                    elo += match.loser2_elo_change

            # Build composite result without the elo field from the player model
            player_dict = {c.name: getattr(player, c.name) for c in player.__table__.columns if c.name != 'elo'} # Build a new dict of the player object without the elo field
            player_dict['elo'] = elo # append the elo field
            return player_dict
        else:
            return player

    @staticmethod
    def get_players(db: Session) -> list[dict]:
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

        # For each player, calculate ELO from matches
        result = []
        for player, total_matches, recently_pantsed in player_rows:
            elo = base.DEFAULT_ELO
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
            result.append({
                "id": player.id,
                "player_name": player.player_name,
                "elo": elo,
                "total_matches": total_matches or 0,
                "recently_pantsed": recently_pantsed
            })
        return result

    @staticmethod
    def update_player(db: Session, player_id: int, player: PlayerUpdate) -> Optional[base.Player]:
        db_player = PlayerService.get_player(db, player_id)
        if not db_player:
            return None
        
        db_player.player_name = player.player_name
        db.commit()
        db.refresh(db_player)
        return db_player

    @staticmethod
    def delete_player(db: Session, player_id: int) -> bool:
        player = PlayerService.get_player(db, player_id)
        if not player:
            return False
        
        player.deleted = True
        player.deleted_at = datetime.now()
        db.commit()
        return True 