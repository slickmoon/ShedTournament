from fastapi import FastAPI, Depends, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from . import database, base, elo
from typing import List
from datetime import datetime

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
async def addplayer(player: PlayerRequest, db: Session = Depends(database.get_db)):
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
async def get_players(db: Session = Depends(database.get_db)):
    return db.query(base.Player).all()

@api.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(database.get_db)):
    player = db.query(base.Player).filter(base.Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api.put("/players/{player_id}")
async def update_player(player: PlayerUpdateRequest, player_id: int = Path(..., description="The ID of the player to update"), db: Session = Depends(database.get_db)):
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
async def delete_player(player_id: int, db: Session = Depends(database.get_db)):
    player = db.query(base.Player).filter(base.Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    audit_log = base.AuditLog(log=f"Player {player.player_name} deleted")
    db.add(audit_log)
    db.commit()
    return {"message": f"Player {player_id} deleted successfully"}

@api.get("/auditlog", response_model=List[AuditLogResponse])
async def get_audit_log(db: Session = Depends(database.get_db)):
    return db.query(base.AuditLog)\
        .order_by(base.AuditLog.timestamp.desc())\
        .limit(100)\
        .all()

@api.post("/record-match")
async def record_match(match: MatchRequest, db: Session = Depends(database.get_db)):
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

