from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import logging

from . import database
from .auth import (
    verify_token, verify_app_password, verify_admin_password,
    create_access_token, LoginRequest, Token
)
from .schemas import (
    PlayerCreate, PlayerUpdate, PlayerResponse,
    MatchCreate, MatchResponse,
    AuditLogResponse, MatchesPerDay
)
from .services import PlayerService, MatchService, AuditLogService, StatsService
from .config import get_settings

settings = get_settings()
if not settings.AUTH_SECRET_KEY:
    raise ValueError("AUTH_SECRET_KEY environment variable is not set")

if not settings.APP_PASSWORD:
    raise ValueError("APP_PASSWORD environment variable is not set")

if not settings.ADMIN_PASSWORD:
    raise ValueError("ADMIN_PASSWORD environment variable is not set")

CORS_ALLOWED_ORIGINS = ["http://localhost", "http://localhost:8000"]
if settings.CUSTOM_HOSTNAME:
    CORS_ALLOWED_ORIGINS.extend([
        f"http://{settings.CUSTOM_HOSTNAME}",
        f"https://{settings.CUSTOM_HOSTNAME}"
    ])

app = FastAPI(
    title="Shed Tournament API",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a sub-application for the /shedapi prefix
api = FastAPI()
app.mount("/shedapi", api)

@api.get("/")
async def root():
    return {"message": "Shed Tournament API"}

@api.post("/login", response_model=Token)
async def login(login_request: LoginRequest):
    if not verify_app_password(login_request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token()
    return {"access_token": access_token, "token_type": "bearer"}

@api.post("/addplayer", response_model=PlayerResponse)
async def addplayer(
    player: PlayerCreate,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    db_player = PlayerService.create_player(db, player)
    AuditLogService.create_log(db, f"Player {player.player_name} added")
    return db_player

@api.get("/players", response_model=list[dict])
async def get_players(
    season_id: int = -1,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    players = PlayerService.get_players(db,season_id)
    return players

@api.get("/stats/streaks", response_model=list[dict])
async def get_player_streaks(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_player_streaks(db)

@api.get("/stats/streaks/longest", response_model=list[dict])
async def get_best_streak(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_longest_streaks(db)

@api.get("/stats/player-kds", response_model=list[dict])
async def get_player_kds(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_player_kds(db)

@api.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: int,
    season_id: int = -1,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    player = PlayerService.get_player(db, player_id, season_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api.put("/players/{player_id}")
async def update_player(
    player: PlayerUpdate,
    player_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    access_password = request.headers.get('X-Admin-Password')
    if not access_password or not verify_admin_password(access_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please provide the correct admin password"
        )
    original_player = PlayerService.get_player(db,player_id)
    if not original_player:
        raise HTTPException(status_code=404, detail=f"Player #{player_id} not found")
    
    # Capture original values before update
    original_name = original_player["player_name"]
    
    if not PlayerService.update_player(db, player_id, player):
        raise HTTPException(status_code=500, detail=f"Failed to update player #{player_id} {original_name}")
    
    AuditLogService.create_log(
        db,
        f"Player #{player_id} updated: Name changed from {original_name} to {player.player_name}."
    )
    return {"message": f"Player {player_id} updated successfully"}

@api.delete("/players/{player_id}")
async def delete_player(
    player_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    access_password = request.headers.get('X-Admin-Password')
    if not access_password or not verify_admin_password(access_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please provide the correct admin password"
        )
    player = PlayerService.get_player(db,player_id)
    if not player:
        raise HTTPException(status_code=404, detail=f"Player #{player_id} not found")
    if not PlayerService.delete_player(db, player_id):
        raise HTTPException(status_code=500, detail=f"Failed to delete #{player_id} {player['player_name']}")
        
    
    AuditLogService.create_log(db, f"Player #{player_id} {player['player_name']} deleted")
    return {"message": f"Player #{player_id} {player['player_name']} deleted successfully"}

@api.get("/auditlog", response_model=list[AuditLogResponse])
async def get_audit_log(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return AuditLogService.get_logs(db)

@api.post("/record-match")
async def record_match(
    match: MatchCreate,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    match_record, error = MatchService.create_match(db, match)
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    winner1 = PlayerService.get_player(db,match.winner1_id)
    loser1 = PlayerService.get_player(db,match.loser1_id)
    winner2 = None
    loser2 = None

    lossMessage = "defeated"
    if match.is_pantsed:
        lossMessage = "pantsed"
    # Create audit log
    if match.is_doubles:
        winner2 = PlayerService.get_player(db,match.winner2_id)
        loser2 = PlayerService.get_player(db,match.loser2_id)
        
        AuditLogService.create_log(
            db,
            f"Doubles match recorded: Players {winner1['player_name']} ({winner1['elo']}) & {winner2['player_name']} ({winner2['elo']}) {lossMessage} {loser1['player_name']} ({loser1['elo']}) & {loser2['player_name']} ({loser2['elo']})"
        )
    else:
        AuditLogService.create_log(
            db,
            f"Match recorded: {winner1['player_name']} ({winner1['elo']}) {lossMessage} {loser1['player_name']} ({loser1['elo']})"
        )

    # Prepare response
    response = {
        "message": "Match recorded successfully",
        "id": match_record.id,
        "is_doubles": match.is_doubles,
        "winners": [{
            "id": winner1["id"],
            "name": winner1["player_name"],
            "new_elo": winner1["elo"],
            "elo_change": match_record.winner1_elo_change
        }],
        "losers": [{
            "id": loser1["id"],
            "name": loser1["player_name"],
            "new_elo": loser1["elo"],
            "elo_change": match_record.loser1_elo_change
        }]
    }
    if match.is_doubles:
        response["winners"].append({
            "id": winner2["id"],
            "name": winner2["player_name"],
            "new_elo": winner2["elo"],
            "elo_change": match_record.winner2_elo_change
        })
        response["losers"].append({
            "id": loser2["id"],
            "name": loser2["player_name"],
            "new_elo": loser2["elo"],
            "elo_change": match_record.loser2_elo_change
        })
    return response

@api.get("/stats/most-matches", response_model=dict)
async def get_most_matches_in_day(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_most_matches_in_day(db)

@api.get("/stats/total-matches", response_model=dict)
async def get_total_matches(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_total_matches(db)

@api.get("/seasons", response_model=list[dict])
async def get_seasons(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return PlayerService.get_seasons(db)

@api.delete("/matches/{match_id}")
async def delete_match(
    match_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    match_info, error = MatchService.delete_match(db, match_id)
    if error:
        raise HTTPException(status_code=500, detail=error)
    AuditLogService.create_log(
        db,
        f"Match #{match_id} between "
        f"{match_info.get('winner1_name', '')}"
        f"{(' & ' + match_info['winner2_name']) if match_info.get('is_doubles') and match_info.get('winner2_name') else ''} "
        f"and {match_info.get('loser1_name', '')}"
        f"{(' & ' + match_info['loser2_name']) if match_info.get('is_doubles') and match_info.get('loser2_name') else ''} undone"
    )
    return {"message": f"Match #{match_id} deleted successfully", "match": match_info}

@api.get("/stats/matches-per-day", response_model=list[MatchesPerDay])
async def get_matches_per_day(
    player_id: int = None,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_matches_per_day(db, player_id)

@api.get("/stats/head-to-head")
async def get_head_to_head_stats(
    player1_id: int,
    player2_id: int,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_head_to_head_stats(db, player1_id, player2_id)

