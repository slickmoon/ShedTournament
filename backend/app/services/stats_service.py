from sqlalchemy.orm import Session
from sqlalchemy import func, or_, cast, Date
from typing import List, Dict, Any
from .. import base

class StatsService:
    @staticmethod
    def get_player_streaks(db: Session) -> List[Dict[str, Any]]:
        players = db.query(base.Player).filter(base.Player.deleted == False).all()
        
        player_streaks = []
        for player in players:
            matches = db.query(base.Match).filter(
                (base.Match.winner1_id == player.id) | 
                (base.Match.winner2_id == player.id) |
                (base.Match.loser1_id == player.id) |
                (base.Match.loser2_id == player.id)
            ).order_by(base.Match.timestamp.desc()).all()
            
            current_streak = 0
            streak_elo_change = 0
            for match in matches:
                if match.winner1_id == player.id or match.winner2_id == player.id:
                    current_streak += 1
                    streak_elo_change += match.winner1_elo_change
                else:
                    break
            
            if current_streak > 1:
                player_streaks.append({
                    "player_id": player.id,
                    "player_name": player.player_name,
                    "current_streak": current_streak,
                    "elo": player.elo,
                    "elo_change": streak_elo_change
                })
        
        player_streaks.sort(key=lambda x: (-x["current_streak"], -x["elo"]))
        return player_streaks[:5]

    @staticmethod
    def get_longest_streaks(db: Session) -> List[Dict[str, Any]]:
        players = db.query(base.Player).filter(base.Player.deleted == False).all()
        
        players_longest_streaks = []
        for player in players:
            matches = db.query(base.Match).filter(
                (base.Match.winner1_id == player.id) | 
                (base.Match.winner2_id == player.id) |
                (base.Match.loser1_id == player.id) |
                (base.Match.loser2_id == player.id)
            ).order_by(base.Match.timestamp.asc()).all()
            
            # Winning streak
            current_streak = 0
            streak_elo_change = 0
            longest_streak = 0
            longest_streak_elo_change = 0
            
            for match in matches:
                if match.winner1_id == player.id or match.winner2_id == player.id:
                    current_streak += 1
                    streak_elo_change += match.winner1_elo_change
                else:
                    longest_streak = current_streak
                    longest_streak_elo_change = streak_elo_change
                    current_streak = 0
                    streak_elo_change = 0

            if current_streak > longest_streak:
                longest_streak = current_streak
                longest_streak_elo_change = streak_elo_change
            

            if longest_streak > 0:
                players_longest_streaks.append({
                    "player_id": player.id,
                    "player_name": player.player_name,
                    "longest_streak": longest_streak,
                    "longest_streak_elo_change": longest_streak_elo_change,
                    "streak_type": "win"
                })
            
            # losing streaks
            current_streak = 0
            streak_elo_change = 0
            longest_streak = 0
            longest_streak_elo_change = 0
            
            for match in matches:
                if match.loser1_id == player.id or match.loser2_id == player.id:
                    current_streak += 1
                    streak_elo_change += match.loser1_elo_change
                else:
                    longest_streak = current_streak
                    longest_streak_elo_change = streak_elo_change
                    current_streak = 0
                    streak_elo_change = 0

            if current_streak > longest_streak:
                longest_streak = current_streak
                longest_streak_elo_change = streak_elo_change

            if longest_streak > 0:
                players_longest_streaks.append({
                    "player_id": player.id,
                    "player_name": player.player_name,
                    "longest_streak": longest_streak,
                    "longest_streak_elo_change": longest_streak_elo_change,
                    "streak_type": "loss"
                })
        
        #players_longest_streaks.sort(key=lambda x: (-x["longest_streak"], -x["longest_streak_elo_change"])) # do sorting and filtering in frontend
        return players_longest_streaks

    @staticmethod
    def get_player_kds(db: Session) -> List[Dict[str, Any]]:
        players = db.query(base.Player).filter(base.Player.deleted == False).all()
        
        player_kds = []
        for player in players:
            wins = db.query(base.Match).filter(
                (base.Match.winner1_id == player.id) | 
                (base.Match.winner2_id == player.id)
            ).all()
            losses = db.query(base.Match).filter(
                (base.Match.loser1_id == player.id) | 
                (base.Match.loser2_id == player.id)
            ).all()

            kdratio = round(len(wins) / len(losses) if len(losses) > 0 else 1, 2)
            
            player_kds.append({
                "player_id": player.id,
                "player_name": player.player_name,
                "wins": len(wins),
                "losses": len(losses),
                "kd": kdratio
            })
        
        player_kds.sort(key=lambda x: (-x["kd"], -x["wins"], +x["losses"]))
        return player_kds[:20]

    @staticmethod
    def get_most_matches_in_day(db: Session) -> Dict[str, Any]:
        player_appearances = db.query(
            base.Player.id,
            base.Player.player_name,
            cast(base.Match.timestamp, Date).label('match_date'),
            func.count(base.Match.id).label('matches_played')
        ).join(
            base.Match,
            or_(
                base.Match.winner1_id == base.Player.id,
                base.Match.winner2_id == base.Player.id,
                base.Match.loser1_id == base.Player.id,
                base.Match.loser2_id == base.Player.id
            )
        ).group_by(
            base.Player.id,
            base.Player.player_name,
            cast(base.Match.timestamp, Date)
        ).subquery()

        max_matches = db.query(
            player_appearances.c.id,
            player_appearances.c.player_name,
            player_appearances.c.match_date,
            player_appearances.c.matches_played
        ).order_by(
            player_appearances.c.matches_played.desc()
        ).first()

        if not max_matches:
            return {
                "player_id": None,
                "player_name": None,
                "date": None,
                "matches_played": 0
            }

        return {
            "player_id": max_matches.id,
            "player_name": max_matches.player_name,
            "date": max_matches.match_date.isoformat(),
            "matches_played": max_matches.matches_played
        }