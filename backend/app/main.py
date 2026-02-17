from fastapi import FastAPI
from app.db.session import Base, engine
from app.models import User
from app.routers.auth import router as auth_router
from app.routers.project import router as projects_router
from app.routers.sprint import router as sprints_router
from app.routers.story import router as stories_router
from app.routers.task import router as tasks_router

app = FastAPI(title="SprintWheel API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sprints_router)
app.include_router(stories_router)
app.include_router(tasks_router)

@app.get("/")
def root():
    return {"ok": True}