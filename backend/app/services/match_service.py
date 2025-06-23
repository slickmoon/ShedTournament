from sqlalchemy.orm import Session
from typing import Tuple, Optional
from .. import base, elo
from ..schemas import MatchCreate

class MatchService:
    @staticmethod
    def create_match(db: Session, match: MatchCreate) -> Tuple[Optional[base.Match], Optional[str]]:
        # Validate players exist and are not deleted
        players = {
            match.winner1_id: db.query(base.Player).filter(
                base.Player.id == match.winner1_id,
                base.Player.deleted == False
            ).first(),
            match.loser1_id: db.query(base.Player).filter(
                base.Player.id == match.loser1_id,
                base.Player.deleted == False
            ).first()
        }
        
        if match.is_doubles:
            players.update({
                match.winner2_id: db.query(base.Player).filter(
                    base.Player.id == match.winner2_id,
                    base.Player.deleted == False
                ).first(),
                match.loser2_id: db.query(base.Player).filter(
                    base.Player.id == match.loser2_id,
                    base.Player.deleted == False
                ).first()
            })
        
        if not all(players.values()):
            return None, "One or more players not found or have been deleted"
        
        # Validate no duplicate players in doubles
        if match.is_doubles and len(set(players.keys())) != 4:
            return None, "Duplicate players not allowed in doubles match"
        
        # Handle events
        event_types = {
            "pantsed": match.is_pantsed,
            "away_game": match.is_away_game,
            "lost_by_foul": match.is_lost_by_foul
        }

        for event_name, is_active in event_types.items():
            if is_active:
                # Get ID for event type
                event = db.query(base.EventType).filter(base.EventType.name == event_name).first()
                if not event:
                    return None, f"DB Error: {event_name} event type not found in EventType table"

                # Create player events for losers
                loser1_event = base.PlayerEvent(
                    player_id=match.loser1_id,
                    event_id=event.id
                )
                db.add(loser1_event)

                if match.is_doubles:
                    loser2_event = base.PlayerEvent(
                        player_id=match.loser2_id,
                        event_id=event.id
                    )
                    db.add(loser2_event)

        if match.is_doubles:
            team1_elo = (players[match.winner1_id].elo + players[match.winner2_id].elo) / 2
            team2_elo = (players[match.loser1_id].elo + players[match.loser2_id].elo) / 2
            new_team1_elo, new_team2_elo = elo.calculate_new_ratings(team1_elo, team2_elo)
            
            elo_diff1 = new_team1_elo - team1_elo
            elo_diff2 = new_team2_elo - team2_elo
            
            # Update player ratings
            players[match.winner1_id].elo = int(players[match.winner1_id].elo + elo_diff1)
            players[match.winner2_id].elo = int(players[match.winner2_id].elo + elo_diff1)
            players[match.loser1_id].elo = int(players[match.loser1_id].elo + elo_diff2)
            players[match.loser2_id].elo = int(players[match.loser2_id].elo + elo_diff2)
            
            match_record = base.Match(
                is_doubles=True,
                winner1_id=match.winner1_id,
                winner2_id=match.winner2_id,
                winner1_starting_elo=players[match.winner1_id].elo - elo_diff1,
                winner2_starting_elo=players[match.winner2_id].elo - elo_diff1,
                winner1_elo_change=elo_diff1,
                winner2_elo_change=elo_diff1,
                loser1_id=match.loser1_id,
                loser2_id=match.loser2_id,
                loser1_starting_elo=players[match.loser1_id].elo - elo_diff2,
                loser2_starting_elo=players[match.loser2_id].elo - elo_diff2,
                loser1_elo_change=elo_diff2,
                loser2_elo_change=elo_diff2
            )
        else:
            new_winner_elo, new_loser_elo = elo.calculate_new_ratings(
                players[match.winner1_id].elo,
                players[match.loser1_id].elo
            )
            
            winner_elo_change = new_winner_elo - players[match.winner1_id].elo
            loser_elo_change = new_loser_elo - players[match.loser1_id].elo
            
            players[match.winner1_id].elo = new_winner_elo
            players[match.loser1_id].elo = new_loser_elo
            
            match_record = base.Match(
                is_doubles=False,
                winner1_id=match.winner1_id,
                winner1_starting_elo=players[match.winner1_id].elo - winner_elo_change,
                winner1_elo_change=winner_elo_change,
                loser1_id=match.loser1_id,
                loser1_starting_elo=players[match.loser1_id].elo - loser_elo_change,
                loser1_elo_change=loser_elo_change
            )
        
        db.add(match_record)
        db.commit()
        db.refresh(match_record)
        
        return match_record, None 

    @staticmethod
    def delete_match(db: Session, match_id: int):
        # Only delete if this is the latest match
        match = db.query(base.Match).order_by(base.Match.timestamp.desc()).first()
        if not match or match.id != match_id:
            return None, "Cannot undo if other matches have taken place following it"
        # Retrieve player names using relationships
        match_info = {
            'id': match.id,
            'timestamp': match.timestamp,
            'is_doubles': match.is_doubles,
            'winner1_id': match.winner1_id,
            'winner1_name': match.winner1.player_name if match.winner1 else None,
            'winner2_id': match.winner2_id,
            'winner2_name': match.winner2.player_name if match.winner2 else None,
            'loser1_id': match.loser1_id,
            'loser1_name': match.loser1.player_name if match.loser1 else None,
            'loser2_id': match.loser2_id,
            'loser2_name': match.loser2.player_name if match.loser2 else None,
            'winner1_elo_change': match.winner1_elo_change,
            'winner2_elo_change': match.winner2_elo_change,
            'loser1_elo_change': match.loser1_elo_change,
            'loser2_elo_change': match.loser2_elo_change,
        }
        db.delete(match)
        db.commit()
        return match_info, None