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
    expire = datetime.now(datetime.UTC) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
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
    winner_id: int
    loser_id: int

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
    return db.query(base.Player).all()

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
    # Get players
    winner = db.query(base.Player).filter(base.Player.id == match.winner_id).first()
    loser = db.query(base.Player).filter(base.Player.id == match.loser_id).first()
    if winner.id == loser.id:
        raise HTTPException(status_code=400, detail="Cannot record match against self")
    if not winner or not loser:
        raise HTTPException(status_code=404, detail="One or both players not found")
    
    # Calculate new ELO ratings
    new_winner_elo, new_loser_elo = elo.calculate_new_ratings(winner.elo, loser.elo)
    original_winner_elo = winner.elo
    original_loser_elo = loser.elo
    # Update player ratings
    winner.elo = new_winner_elo
    loser.elo = new_loser_elo
    
    # Create audit log
    audit_log = base.AuditLog(
        log=f"Match recorded: {winner.player_name} ({winner.elo}) defeated {loser.player_name} ({loser.elo})"
    )
    
    # Save changes
    db.add(audit_log)
    db.commit()
    
    return {
        "message": "Match recorded successfully",
        "winner": {
            "id": winner.id,
            "name": winner.player_name,
            "new_elo": winner.elo,
            "elo_change": winner.elo - original_winner_elo 
        },
        "loser": {
            "id": loser.id,
            "name": loser.player_name,
            "new_elo": loser.elo,
            "elo_change": loser.elo - original_loser_elo
        }
    }

