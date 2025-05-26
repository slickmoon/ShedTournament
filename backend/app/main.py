from fastapi import FastAPI, Depends, HTTPException, Path, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from . import database, base, elo
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv
from sqlalchemy import func, or_, cast, Date

# Load environment variables
load_dotenv()

# Get the secret key from environment variable
SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("AUTH_SECRET_KEY environment variable is not set")

APP_PASSWORD = os.getenv("APP_PASSWORD")
if not APP_PASSWORD:
    raise ValueError("APP_PASSWORD environment variable is not set")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise ValueError("ADMIN_PASSWORD environment variable is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 365

app = FastAPI(
    title="Shed Tournament API",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://slkmn.k.vu", "https://slkmn.k.vu", "http://localhost", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a sub-application for the /shedapi prefix
api = FastAPI()
app.mount("/shedapi", api)

# Security
security = HTTPBearer()

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    password: str

def create_access_token():
    expire = datetime.now() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@api.post("/login", response_model=Token)
async def login(login_request: LoginRequest):
    if login_request.password != APP_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token()
    return {"access_token": access_token, "token_type": "bearer"}

class PlayerRequest(BaseModel):
    player_name: str

class PlayerUpdateRequest(BaseModel):
    player_name: str
    player_elo: int

class PlayerResponse(BaseModel):
    id: int
    player_name: str
    elo: int

    class Config:
        orm_mode = True

class AuditLogResponse(BaseModel):
    id: int
    log: str
    timestamp: datetime

    class Config:
        orm_mode = True

class MatchRequest(BaseModel):
    is_doubles: bool = False
    winner1_id: int
    winner2_id: Optional[int] = None
    loser1_id: int
    loser2_id: Optional[int] = None

@api.get("/")
async def root():
    return {"message": "Shed Tournament API"}

@api.post("/addplayer", response_model=PlayerResponse)
async def addplayer(
    player: PlayerRequest, 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    db_player = base.Player(player_name=player.player_name)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    
    # Create audit log
    audit_log = base.AuditLog(log=f"Player {player.player_name} added")
    db.add(audit_log)
    db.commit()
    
    return db_player

@api.get("/players", response_model=List[dict])
async def get_players(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    # Create a subquery to count matches for each player
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

    # Get players with their match counts
    players = db.query(
        base.Player,
        match_counts.c.total_matches
    ).outerjoin( # this is a LEFT JOIN for SQL (LEFT OUTER JOIN), .join() is an inner join
        match_counts, 
        base.Player.id == match_counts.c.id
    ).filter(
        base.Player.deleted == False
    ).order_by(
        base.Player.player_name.asc()
    ).all()

    # Convert to response format
    return [
        {
            "id": player.id,
            "player_name": player.player_name,
            "elo": player.elo,
            "total_matches": total_matches or 0
        }
        for player, total_matches in players
    ]

@api.get("/players/streaks", response_model=List[dict])
async def get_player_streaks(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    # Get all non-deleted players
    players = db.query(base.Player).filter(base.Player.deleted == False).all()
    
    player_streaks = []
    for player in players:
        # Get all matches involving this player
        matches = db.query(base.Match).filter(
            (base.Match.winner1_id == player.id) | 
            (base.Match.winner2_id == player.id) |
            (base.Match.loser1_id == player.id) |
            (base.Match.loser2_id == player.id)
        ).order_by(base.Match.timestamp.desc()).all()
        
        # Calculate current streak
        current_streak = 0
        streak_elo_change = 0
        for match in matches:
            # Check if player won
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
    
    # Sort by streak (descending) and then by elo (descending) for tiebreaker
    player_streaks.sort(key=lambda x: (-x["current_streak"], -x["elo"]))
    player_streaks = player_streaks[:5]

    return player_streaks

@api.get("/players/streaks/longest", response_model=List[dict])
async def get_best_streak(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    # Get all non-deleted players
    players = db.query(base.Player).filter(base.Player.deleted == False).all()
    
    players_longest_streaks = []
    for player in players:
        # Get all matches involving this player
        matches = db.query(base.Match).filter(
            (base.Match.winner1_id == player.id) | 
            (base.Match.winner2_id == player.id) |
            (base.Match.loser1_id == player.id) |
            (base.Match.loser2_id == player.id)
        ).order_by(base.Match.timestamp.desc()).all()
        
        # Calculate current streak
        current_streak = 0
        streak_elo_change = 0
        longest_streak = 0
        longest_streak_elo_change = 0
        for match in matches:
            # Check if player won
            if match.winner1_id == player.id or match.winner2_id == player.id:
                current_streak += 1
                streak_elo_change += match.winner1_elo_change
            else:
                longest_streak = current_streak
                longest_streak_elo_change = streak_elo_change
                current_streak = 0
                streak_elo_change = 0

        if longest_streak > 0:
            players_longest_streaks.append({
                "player_id": player.id,
                "player_name": player.player_name,
                "longest_streak": longest_streak,
                "longest_streak_elo_change": longest_streak_elo_change,
                "streak_type": "win"
            })
    for player in players:
        # Get all matches involving this player
        matches = db.query(base.Match).filter(
            (base.Match.winner1_id == player.id) | 
            (base.Match.winner2_id == player.id) |
            (base.Match.loser1_id == player.id) |
            (base.Match.loser2_id == player.id)
        ).order_by(base.Match.timestamp.desc()).all()
        
        # Calculate current streak
        current_streak = 0
        streak_elo_change = 0
        longest_streak = 0
        longest_streak_elo_change = 0
        for match in matches:
            # Check if player won
            if match.loser1_id == player.id or match.loser2_id == player.id:
                current_streak += 1
                streak_elo_change += match.loser1_elo_change
            else:
                longest_streak = current_streak
                longest_streak_elo_change = streak_elo_change
                current_streak = 0
                streak_elo_change = 0

        if longest_streak > 0:
            players_longest_streaks.append({
                "player_id": player.id,
                "player_name": player.player_name,
                "longest_streak": longest_streak,
                "longest_streak_elo_change": longest_streak_elo_change,
                "streak_type": "loss"
            })
    
    # Sort by streak (descending) and then by elo (descending) for tiebreaker
    players_longest_streaks.sort(key=lambda x: (-x["longest_streak"], -x["longest_streak_elo_change"]))

    return players_longest_streaks

@api.get("/players/kds", response_model=List[dict])
async def get_player_kds(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    # Get all non-deleted players
    players = db.query(base.Player).filter(base.Player.deleted == False).all()
    
    player_kds = []
    for player in players:
        # Get all matches involving this player
        wins = db.query(base.Match).filter(
            (base.Match.winner1_id == player.id) | 
            (base.Match.winner2_id == player.id)
        ).all()
        losses = db.query(base.Match).filter(
            (base.Match.loser1_id == player.id) | 
            (base.Match.loser2_id == player.id)
        ).all()

        # Calculate current ratio
        if (len(wins) == 0 and len(losses) == 0):
            kdratio = 0
        else:
            kdratio = round(len(wins) / len(losses) if len(losses) > 0 else 1, 2)
            
        player_kds.append({
            "player_id": player.id,
            "player_name": player.player_name,
            "wins": len(wins),
            "losses": len(losses),
            "kd": kdratio
        })
    
    # Sort by kd (descending) and then by wins (descending) for tiebreaker
    player_kds.sort(key=lambda x: (-x["kd"], -x["wins"], +x["losses"]))
    player_kds = player_kds[:20]

    return player_kds

@api.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: int, 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    player = db.query(base.Player).filter(base.Player.id == player_id, base.Player.deleted == False).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api.put("/players/{player_id}")
async def update_player(
    player: PlayerUpdateRequest, 
    player_id: int,
    access_password: str, 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    if access_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Please provide the correct admin password")
    db_player = db.query(base.Player).filter(base.Player.id == player_id, base.Player.deleted == False).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player #{player_id} not found")
    
    if db_player.deleted:
        raise HTTPException(status_code=400, detail="Player #{player_id} cannot be updated because they have been deleted")
    orig_player_name = db_player.player_name
    orig_player_elo = db_player.elo
    db_player.player_name = player.player_name
    db_player.elo = player.player_elo
    audit_log = base.AuditLog(log=f"Player #{player_id} updated: Name changed from {orig_player_name} to {player.player_name}. ELO Changed from {orig_player_elo} to {player.player_elo}")
    db.add(audit_log)
    db.commit()
    return {"message": f"Player {player_id} updated successfully"}

@api.delete("/players/{player_id}")
async def delete_player(
    player_id: int, 
    access_password: str,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    if access_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Please provide the correct admin password")
    player = db.query(base.Player).filter(base.Player.id == player_id, base.Player.deleted == False).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Soft delete the player
    player.deleted = True
    player.deleted_at = datetime.now()
    
    # Create audit log
    audit_log = base.AuditLog(log=f"Player {player.player_name} deleted")
    db.add(audit_log)
    db.commit()
    return {"message": f"Player {player_id} deleted successfully"}

@api.get("/auditlog", response_model=List[AuditLogResponse])
async def get_audit_log(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return db.query(base.AuditLog)\
        .order_by(base.AuditLog.timestamp.desc())\
        .limit(100)\
        .all()

@api.post("/record-match")
async def record_match(
    match: MatchRequest, 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    # Validate doubles match
    if match.is_doubles and (match.winner2_id is None or match.loser2_id is None):
        raise HTTPException(status_code=400, detail="Doubles match requires both winner2_id and loser2_id")
    if not match.is_doubles and (match.winner2_id is not None or match.loser2_id is not None):
        raise HTTPException(status_code=400, detail="Singles match cannot have winner2_id or loser2_id")

    # Get players
    winner1 = db.query(base.Player).filter(base.Player.id == match.winner1_id, base.Player.deleted == False).first()
    loser1 = db.query(base.Player).filter(base.Player.id == match.loser1_id, base.Player.deleted == False).first()
    
    if not winner1 or not loser1:
        raise HTTPException(status_code=404, detail="One or both players not found or have been deleted")
    
    if match.is_doubles:
        winner2 = db.query(base.Player).filter(base.Player.id == match.winner2_id, base.Player.deleted == False).first()
        loser2 = db.query(base.Player).filter(base.Player.id == match.loser2_id, base.Player.deleted == False).first()
        if not winner2 or not loser2:
            raise HTTPException(status_code=404, detail="One or both players not found or have been deleted")
        
        # Validate no duplicate players in doubles
        player_ids = {match.winner1_id, match.winner2_id, match.loser1_id, match.loser2_id}
        if len(player_ids) != 4:
            raise HTTPException(status_code=400, detail="Duplicate players not allowed in doubles match")
    else:
        # Validate singles match
        if winner1.id == loser1.id:
            raise HTTPException(status_code=400, detail="Cannot record match against self")
    original_winner1_elo = winner1.elo
    original_loser1_elo = loser1.elo
    original_winner2_elo = 0
    original_loser2_elo = 0
    # Calculate new ELO ratings
    if match.is_doubles:
        original_winner2_elo = winner2.elo
        original_loser2_elo = loser2.elo
        # For doubles, average the ELO ratings of each team
        team1_elo = (winner1.elo + winner2.elo) / 2
        team2_elo = (loser1.elo + loser2.elo) / 2
        new_team1_elo, new_team2_elo = elo.calculate_new_ratings(team1_elo, team2_elo)
        
        # Calculate individual changes
        elo_diff1 = new_team1_elo - team1_elo
        elo_diff2 = new_team2_elo - team2_elo
        
        # Update player ratings
        winner1.elo = int(winner1.elo + elo_diff1)
        winner2.elo = int(winner2.elo + elo_diff1)
        loser1.elo = int(loser1.elo + elo_diff2)
        loser2.elo = int(loser2.elo + elo_diff2)
        
        # Create match record
        match_record = base.Match(
            is_doubles=True,
            winner1_id=winner1.id,
            winner2_id=winner2.id,
            winner1_starting_elo=original_winner1_elo,
            winner2_starting_elo=original_winner2_elo,
            winner1_elo_change=elo_diff1,
            winner2_elo_change=elo_diff1,
            loser1_id=loser1.id,
            loser2_id=loser2.id,
            loser1_starting_elo=original_loser1_elo,
            loser2_starting_elo=original_loser2_elo,
            loser1_elo_change=elo_diff2,
            loser2_elo_change=elo_diff2
        )
        db.add(match_record)
        
        # Create audit log
        audit_log = base.AuditLog(
            log=f"Doubles match recorded: {winner1.player_name} & {winner2.player_name} defeated {loser1.player_name} & {loser2.player_name}"
        )
    else:
        # Singles match
        new_winner_elo, new_loser_elo = elo.calculate_new_ratings(winner1.elo, loser1.elo)
        
        # Update player ratings
        winner1.elo = new_winner_elo
        loser1.elo = new_loser_elo
        
        # Create match record
        match_record = base.Match(
            is_doubles=False,
            winner1_id=winner1.id,
            winner1_starting_elo=original_winner1_elo,
            winner1_elo_change=new_winner_elo - original_winner1_elo,
            loser1_id=loser1.id,
            loser1_starting_elo=original_loser1_elo,
            loser1_elo_change=new_loser_elo - original_loser1_elo
        )
        db.add(match_record)
        
        # Create audit log
        audit_log = base.AuditLog(
            log=f"Match recorded: {winner1.player_name} ({winner1.elo}) defeated {loser1.player_name} ({loser1.elo})"
        )
    
    # Save changes
    db.add(audit_log)
    db.commit()
    
    # Prepare response
    response = {
        "message": "Match recorded successfully",
        "is_doubles": match.is_doubles,
        "winners": [{
            "id": winner1.id,
            "name": winner1.player_name,
            "new_elo": winner1.elo,
            "elo_change": winner1.elo - original_winner1_elo
        }],
        "losers": [{
            "id": loser1.id,
            "name": loser1.player_name,
            "new_elo": loser1.elo,
            "elo_change": loser1.elo - original_loser1_elo
        }]
    }
    
    if match.is_doubles:
        response["winners"].append({
            "id": winner2.id,
            "name": winner2.player_name,
            "new_elo": winner2.elo,
            "elo_change": winner2.elo - original_winner2_elo
        })
        response["losers"].append({
            "id": loser2.id,
            "name": loser2.player_name,
            "new_elo": loser2.elo,
            "elo_change": loser2.elo - original_loser2_elo
        })
    
    return response

@api.get("/matches/most", response_model=dict)
async def get_most_matches_in_day(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    # Create a CTE (Common Table Expression) to get all player appearances in matches
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

    # Get the maximum matches played in a day for each player
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

