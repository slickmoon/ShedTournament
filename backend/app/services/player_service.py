from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
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
    def get_player(db: Session, player_id: int) -> Optional[base.Player]:
        return db.query(base.Player).filter(
            base.Player.id == player_id,
            base.Player.deleted == False
        ).first()

    @staticmethod
    def get_players(db: Session) -> List[Tuple[base.Player, int]]:
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

        return db.query(
            base.Player,
            match_counts.c.total_matches
        ).outerjoin(
            match_counts,
            base.Player.id == match_counts.c.id
        ).filter(
            base.Player.deleted == False
        ).order_by(
            base.Player.player_name.asc()
        ).all()

    @staticmethod
    def update_player(db: Session, player_id: int, player: PlayerUpdate) -> Optional[base.Player]:
        db_player = PlayerService.get_player(db, player_id)
        if not db_player:
            return None
        
        db_player.player_name = player.player_name
        db_player.elo = player.player_elo
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