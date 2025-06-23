from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

DEFAULT_ELO = 1000  # Default ELO rating for new players

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String)
    elo = Column(Integer, default=DEFAULT_ELO)  # Default ELO rating
    deleted = Column(Boolean, default=False)  # Soft delete flag
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # When the player was deleted

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    is_doubles = Column(Boolean, default=False)
    winner1_id = Column(Integer, ForeignKey('players.id'))
    winner2_id = Column(Integer, ForeignKey('players.id'), nullable=True)
    winner1_starting_elo = Column(Integer, default=0)
    winner2_starting_elo = Column(Integer, default=0, nullable=True)
    winner1_elo_change = Column(Integer, default=0)
    winner2_elo_change = Column(Integer, default=0, nullable=True)
    loser1_id = Column(Integer, ForeignKey('players.id'))
    loser2_id = Column(Integer, ForeignKey('players.id'), nullable=True)
    loser1_starting_elo = Column(Integer, default=0)
    loser2_starting_elo = Column(Integer, default=0, nullable=True)
    loser1_elo_change = Column(Integer, default=0)
    loser2_elo_change = Column(Integer, default=0, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    winner1 = relationship("Player", foreign_keys=[winner1_id])
    winner2 = relationship("Player", foreign_keys=[winner2_id])
    loser1 = relationship("Player", foreign_keys=[loser1_id])
    loser2 = relationship("Player", foreign_keys=[loser2_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    log = Column(String)

class EventType(Base):
    __tablename__ = "event_type"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    events = relationship("PlayerEvent", back_populates="event_type")

class PlayerEvent(Base):
    __tablename__ = "player_events"
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("event_type.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    event_type = relationship("EventType", back_populates="events") 