from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.jwt import decode_token
from app.db.session import get_db
from app.models.user import User, UserProject

bearer = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = creds.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("missing sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    rel = db.query(UserProject).filter(UserProject.user_id == user.id).first()
    if not rel:
        db.add(UserProject(user_id=user.id, projects=[]))
        db.commit()

    return user