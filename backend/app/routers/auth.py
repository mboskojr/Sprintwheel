import os
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import GOOGLE_CLIENT_ID
from app.core.deps import get_current_user
from app.core.jwt import (
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut
from app.schemas.auth import (
    ChangeNameIn,
    ChangePasswordIn,
    ForgotPasswordIn,
    ResetPasswordIn,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLoginIn(BaseModel):
    id_token: str


def send_password_reset_email(email: str, reset_link: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("FROM_EMAIL", smtp_user)

    if not smtp_host or not smtp_user or not smtp_pass:
        raise HTTPException(
            status_code=500,
            detail="SMTP email settings are not configured",
        )

    subject = "Reset your SprintWheel password"
    body = f"""
Hi,

We received a request to reset your SprintWheel password.

Click the link below to choose a new password:
{reset_link}

If you did not request this, you can ignore this email.

Thanks,
SprintWheel
""".strip()

    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(from_email, email, msg.as_string())


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        token = create_password_reset_token(user.email)
        frontend_url = os.getenv(
            "FRONTEND_URL",
            "https://sprintwheel-frontend.vercel.app",
        )
        reset_link = f"{frontend_url}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_link)

    return {
        "message": "If an account exists for that email, a reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters",
        )

    if len(data.new_password) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 characters or fewer",
        )

    email = verify_password_reset_token(data.token)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    db.commit()
    db.refresh(user)

    return {"message": "Password reset successful"}


@router.post("/register", response_model=UserOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        name=data.name,
        email=data.email,
        role="student",
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)
    return user


@router.put("/change-password")
def change_password(
    data: ChangePasswordIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    db.refresh(current_user)

    return {"message": "Password updated successfully"}


@router.put("/change-name", response_model=UserOut)
def change_name(
    data: ChangeNameIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    new_name = data.new_name.strip()

    if not new_name:
        raise HTTPException(status_code=400, detail="New name cannot be empty")

    current_user.name = new_name
    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/google", response_model=TokenOut)
def google_login(data: GoogleLoginIn, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")

    try:
        info = id_token.verify_oauth2_token(
            data.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    if info.get("email_verified") is not True:
        raise HTTPException(status_code=403, detail="Google email not verified")

    email = info.get("email")
    name = info.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Google account missing email")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            id=str(uuid.uuid4()),
            name=name or "Google User",
            email=email,
            role="student",
            hashed_password=hash_password(uuid.uuid4().hex),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}