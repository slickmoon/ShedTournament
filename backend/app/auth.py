from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from .config import get_settings

settings = get_settings()
security = HTTPBearer()

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    password: str

def create_access_token() -> str:
    expire = datetime.now() + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.AUTH_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_admin_password(password: str) -> bool:
    return password == settings.ADMIN_PASSWORD

def verify_app_password(password: str) -> bool:
    return password == settings.APP_PASSWORD 