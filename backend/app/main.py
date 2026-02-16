from fastapi import FastAPI
from app.db.session import Base, engine
from app.models import User
from app.routers.auth import router as auth_router

app = FastAPI(title="SprintWheel API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth_router)

@app.get("/")
def root():
    return {"ok": True}