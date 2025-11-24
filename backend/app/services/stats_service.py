from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, cast, Date
from typing import List, Dict, Any
from .. import base
from player_service import PlayerService

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
                player_elo, _ = PlayerService.calculate_player_season_data(player, None, db)
                player_streaks.append({
                    "player_id": player.id,
                    "player_name": player.player_name,
                    "current_streak": current_streak,
                    "elo": player_elo,
                    "elo_change": streak_elo_change
                })
        
        player_streaks.sort(key=lambda x: (-x["current_streak"], -x["elo_change"]))
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
                    if current_streak > longest_streak:
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
                    if current_streak > longest_streak:
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
            player_appearances.c.matches_played.desc(),
            player_appearances.c.player_name.asc()
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
    
    @staticmethod
    def get_total_matches(db: Session) -> Dict[str, Any]:
        price_per_match = 3
        time_per_game = 15

        total_matches = db.query(
            func.count(base.Match.id).label('match_count')
        ).first()

        w1_matches = db.query(
            func.count(base.Match.winner1_id).label('match_count')
        ).filter((base.Match.winner1_id != None )).first()
        w2_matches = db.query(
            func.count(base.Match.winner2_id).label('match_count')
        ).filter((base.Match.winner2_id != None )).first()
        l1_matches = db.query(
            func.count(base.Match.loser1_id).label('match_count')
        ).filter((base.Match.loser1_id != None )).first()
        l2_matches = db.query(
            func.count(base.Match.loser2_id).label('match_count')
        ).filter((base.Match.loser2_id != None )).first()

        return {
            "total_matches": total_matches.match_count,
            "money_saved": (total_matches.match_count * price_per_match),
            "time_wasted": (total_matches.match_count * time_per_game),
            "per_person_time_wasted": ((w1_matches.match_count + w2_matches.match_count + l1_matches.match_count + l2_matches.match_count) * time_per_game)
        }
    
    @staticmethod
    def get_matches_per_day(db: Session, player_id = None) -> list[dict]:
        if player_id:
            # get match results for this player only
            results = db.query(
                cast(base.Match.timestamp, Date).label('date'),
                func.count(base.Match.id).label('count')
            ).filter(
                (base.Match.winner1_id == player_id) |
                (base.Match.winner2_id == player_id) |
                (base.Match.loser1_id == player_id) |
                (base.Match.loser2_id == player_id)
            ).group_by(cast(base.Match.timestamp, Date))\
            .order_by(cast(base.Match.timestamp, Date).asc())
        else:
            results = db.query(
                cast(base.Match.timestamp, Date).label('date'),
                func.count(base.Match.id).label('count')
            ).group_by(cast(base.Match.timestamp, Date))\
            .order_by(cast(base.Match.timestamp, Date).asc())
        
        # Format results as list of dicts with date as dd/mm/yy
        matches_per_day = []
        for row in results:
            date_str = row.date.strftime('%d/%m/%y')
            matches_per_day.append({
                'date': date_str,
                'count': row.count
            })
        return matches_per_day

    @staticmethod
    def get_head_to_head_stats(db: Session, player1_id: int, player2_id: int) -> dict:
        """Get head-to-head statistics between two players"""
        
        # Get all matches where both players participated
        matches = db.query(base.Match).filter(
            or_(
                # Player 1 and Player 2 on opposite teams
                and_(
                    or_(base.Match.winner1_id == player1_id, base.Match.winner2_id == player1_id),
                    or_(base.Match.loser1_id == player2_id, base.Match.loser2_id == player2_id)
                ),
                and_(
                    or_(base.Match.winner1_id == player2_id, base.Match.winner2_id == player2_id),
                    or_(base.Match.loser1_id == player1_id, base.Match.loser2_id == player1_id)
                )
            )
        ).order_by(base.Match.timestamp.asc()).all()
        
        # Get player names
        player1 = db.query(base.Player).filter(base.Player.id == player1_id).first()
        player2 = db.query(base.Player).filter(base.Player.id == player2_id).first()
        
        if not player1 or not player2:
            return {
                "error": "One or both players not found"
            }
        
        # Calculate statistics
        player1_wins = 0
        player2_wins = 0
        player1_elo_gained = 0
        player2_elo_gained = 0
        total_matches = len(matches)
        
        # Track days of the week for most frequent play day
        day_counts = {}
        
        for match in matches:
            # Determine who won
            player1_was_winner = (match.winner1_id == player1_id or match.winner2_id == player1_id)
            player2_was_winner = (match.winner1_id == player2_id or match.winner2_id == player2_id)
            
            if player1_was_winner:
                player1_wins += 1
                # Calculate ELO gained by player1
                if match.winner1_id == player1_id:
                    player1_elo_gained += match.winner1_elo_change
                else:
                    player1_elo_gained += match.winner2_elo_change
            elif player2_was_winner:
                player2_wins += 1
                # Calculate ELO gained by player2
                if match.winner1_id == player2_id:
                    player2_elo_gained += match.winner1_elo_change
                else:
                    player2_elo_gained += match.winner2_elo_change
            
            # Track day of week
            day_of_week = match.timestamp.strftime('%A')
            day_counts[day_of_week] = day_counts.get(day_of_week, 0) + 1
        
        # Get current elo for players
        player1_elo, _ = PlayerService.calculate_player_season_data(player1, None, db)
        player2_elo, _ = PlayerService.calculate_player_season_data(player2, None, db)

        # Find most frequent play day
        most_frequent_day = max(day_counts.items(), key=lambda x: x[1]) if day_counts else None
        
        # Calculate win percentages
        player1_win_percentage = round((player1_wins / total_matches) * 100, 1) if total_matches > 0 else 0
        player2_win_percentage = round((player2_wins / total_matches) * 100, 1) if total_matches > 0 else 0

        return {
            "player1": {
                "id": player1_id,
                "name": player1.player_name,
                "wins": player1_wins,
                "losses": player2_wins,
                "win_percentage": player1_win_percentage,
                "elo_gained": player1_elo_gained,
                "current_elo": player1_elo
            },
            "player2": {
                "id": player2_id,
                "name": player2.player_name,
                "wins": player2_wins,
                "losses": player1_wins,
                "win_percentage": player2_win_percentage,
                "elo_gained": player2_elo_gained,
                "current_elo": player2_elo
            },
            "total_matches": total_matches,
            "most_frequent_day": most_frequent_day[0] if most_frequent_day else None,
            "most_frequent_day_count": most_frequent_day[1] if most_frequent_day else 0,
            "day_breakdown": day_counts
        }
    