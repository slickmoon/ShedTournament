from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Player schemas
class PlayerBase(BaseModel):
    player_name: str

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(PlayerBase):
    player_elo: int

class PlayerResponse(PlayerBase):
    id: int
    elo: int

    class Config:
        from_attributes = True

# Match schemas
class MatchBase(BaseModel):
    is_doubles: bool = False
    winner1_id: int
    winner2_id: Optional[int] = None
    loser1_id: int
    loser2_id: Optional[int] = None
    is_pantsed: bool = False
    is_away_game: bool = False
    is_lost_by_foul: bool = False

class MatchCreate(MatchBase):
    pass

class MatchResponse(MatchBase):
    id: int
    timestamp: datetime
    winner1_id: int
    winner2_id: Optional[int] = None
    loser1_id: int
    loser2_id: Optional[int] = None
    winner1_starting_elo: int
    winner2_starting_elo: Optional[int]
    winner1_elo_change: int
    winner2_elo_change: Optional[int]
    loser1_starting_elo: int
    loser2_starting_elo: Optional[int]
    loser1_elo_change: int
    loser2_elo_change: Optional[int]

    class Config:
        from_attributes = True

# Audit log schemas
class AuditLogResponse(BaseModel):
    id: int
    log: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Stats schemas
class Stats(BaseModel):
    player_id: int
    player_name: str
    total_matches: int
    wins: int
    losses: int
    kd_ratio: float
    current_streak: int
    longest_streak: int
    elo: int

class EventTypeBase(BaseModel):
    name: str

class EventTypeCreate(EventTypeBase):
    pass

class EventType(EventTypeBase):
    id: int

    class Config:
        from_attributes = True

class PlayerEventBase(BaseModel):
    player_id: int
    event_id: int

class PlayerEventCreate(PlayerEventBase):
    pass

class PlayerEvent(PlayerEventBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class MatchesPerDay(BaseModel):
    date: str
    count: int

    class Config:
        from_attributes = True 