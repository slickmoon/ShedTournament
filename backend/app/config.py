from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@shed-tournament-db:5432/competition_app"
    
    # Authentication
    AUTH_SECRET_KEY: str
    APP_PASSWORD: str
    ADMIN_PASSWORD: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 365
    
    # CORS
    CORS_ALLOWED_ORIGINS: List[str] = ["http://localhost", "http://localhost:8000"]
    CUSTOM_HOSTNAME: str
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 