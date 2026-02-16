from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import JWT_SECRET, JWT_ALG, ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": exp}, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
