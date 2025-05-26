from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import database
from .auth import (
    verify_token, verify_app_password, verify_admin_password,
    create_access_token, LoginRequest, Token
)
from .schemas import (
    PlayerCreate, PlayerUpdate, PlayerResponse,
    MatchCreate, MatchResponse,
    AuditLogResponse
)
from .services import PlayerService, MatchService, AuditLogService, StatsService
from .config import get_settings

settings = get_settings()
if not settings.SECRET_KEY:
    raise ValueError("AUTH_SECRET_KEY environment variable is not set")

if not settings.APP_PASSWORD:
    raise ValueError("APP_PASSWORD environment variable is not set")

if not settings.ADMIN_PASSWORD:
    raise ValueError("ADMIN_PASSWORD environment variable is not set")

if settings.CUSTOM_HOSTNAME:
    settings.CORS_ALLOWED_ORIGINS.extend([
        f"http://{settings.CUSTOM_HOSTNAME}",
        f"https://{settings.CUSTOM_HOSTNAME}"
    ])

app = FastAPI(
    title="Shed Tournament API",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
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
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    players = PlayerService.get_players(db)
    return [
        {
            "id": player.id,
            "player_name": player.player_name,
            "elo": player.elo,
            "total_matches": total_matches or 0
        }
        for player, total_matches in players
    ]

@api.get("/players/streaks", response_model=list[dict])
async def get_player_streaks(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_player_streaks(db)

@api.get("/players/streaks/longest", response_model=list[dict])
async def get_best_streak(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_longest_streaks(db)

@api.get("/players/kds", response_model=list[dict])
async def get_player_kds(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_player_kds(db)

@api.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: int,
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    player = PlayerService.get_player(db, player_id)
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
    
    db_player = PlayerService.update_player(db, player_id, player)
    if not db_player:
        raise HTTPException(status_code=404, detail=f"Player #{player_id} not found")
    
    AuditLogService.create_log(
        db,
        f"Player #{player_id} updated: Name changed to {player.player_name}. ELO Changed to {player.player_elo}"
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
    
    if not PlayerService.delete_player(db, player_id):
        raise HTTPException(status_code=404, detail="Player not found")
    
    AuditLogService.create_log(db, f"Player #{player_id} deleted")
    return {"message": f"Player {player_id} deleted successfully"}

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
    
    # Create audit log
    if match.is_doubles:
        AuditLogService.create_log(
            db,
            f"Doubles match recorded: Players {match.winner1_id} & {match.winner2_id} defeated {match.loser1_id} & {match.loser2_id}"
        )
    else:
        AuditLogService.create_log(
            db,
            f"Match recorded: Player {match.winner1_id} defeated {match.loser1_id}"
        )
    
    return {
        "message": "Match recorded successfully",
        "match": match_record
    }

@api.get("/matches/most", response_model=dict)
async def get_most_matches_in_day(
    db: Session = Depends(database.get_db),
    token: dict = Depends(verify_token)
):
    return StatsService.get_most_matches_in_day(db)

