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

# Load environment variables
load_dotenv()

# Get the secret key from environment variable
SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("AUTH_SECRET_KEY environment variable is not set")

APP_PASSWORD = os.getenv("APP_PASSWORD")
if not APP_PASSWORD:
    raise ValueError("APP_PASSWORD environment variable is not set")

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

@api.get("/players", response_model=List[PlayerResponse])
async def get_players(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return db.query(base.Player).order_by(base.Player.elo.desc()).all()

@api.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: int, 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    player = db.query(base.Player).filter(base.Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api.put("/players/{player_id}")
async def update_player(
    player: PlayerUpdateRequest, 
    player_id: int = Path(..., description="The ID of the player to update"), 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    db_player = db.query(base.Player).filter(base.Player.id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db_player.player_name = player.player_name
    db_player.elo = player.player_elo
    audit_log = base.AuditLog(log=f"Player {player.player_name} updated")
    db.add(audit_log)
    db.commit()
    return {"message": f"Player {player_id} updated successfully"}

@api.delete("/players/{player_id}")
async def delete_player(
    player_id: int, 
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    player = db.query(base.Player).filter(base.Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
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
    winner1 = db.query(base.Player).filter(base.Player.id == match.winner1_id).first()
    loser1 = db.query(base.Player).filter(base.Player.id == match.loser1_id).first()
    print(f"winner1: {winner1}")
    print(f"loser1: {loser1}")

    if not winner1 or not loser1:
        raise HTTPException(status_code=404, detail="One or both players not found")
    
    if match.is_doubles:
        winner2 = db.query(base.Player).filter(base.Player.id == match.winner2_id).first()
        loser2 = db.query(base.Player).filter(base.Player.id == match.loser2_id).first()
        print(f"winner2: {winner2}")
        print(f"loser2: {loser2}")
        if not winner2 or not loser2:
            raise HTTPException(status_code=404, detail="One or both players not found")
        
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
    print(f"original_winner1_elo: {original_winner1_elo}")
    print(f"original_loser1_elo: {original_loser1_elo}")
    # Calculate new ELO ratings
    if match.is_doubles:
        original_winner2_elo = winner2.elo
        original_loser2_elo = loser2.elo
        print(f"original_winner2_elo: {original_winner2_elo}")
        print(f"original_loser2_elo: {original_loser2_elo}")
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

