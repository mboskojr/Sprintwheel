from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db.session import Base, engine
from app.models import User
from app.routers.auth import router as auth_router
from app.routers.project import router as projects_router
from app.routers.sprint import router as sprints_router
from app.routers.story import router as stories_router
from app.routers.task import router as tasks_router
from app.routers.project_events import router as project_events_router
from app.routers.information_radiator import router as information_radiator_router
from app.routers.notifications import router as notifications_router
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.services.notification_scheduler import create_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="SprintWheel API", lifespan=lifespan)


def app_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[2]


BASE_DIR = app_base_dir()
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
ASSETS_DIR = FRONTEND_DIST / "assets"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8765",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(project_events_router)
app.include_router(information_radiator_router)
app.include_router(notifications_router)


if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.get("/")
def serve_index():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"ok": True, "message": "Frontend build not found. Run npm run build in frontend/."}


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    requested = FRONTEND_DIST / full_path
    index_file = FRONTEND_DIST / "index.html"

    if requested.exists() and requested.is_file():
        return FileResponse(requested)

    if index_file.exists():
        return FileResponse(index_file)

    return {"ok": False, "message": "Frontend build not found. Run npm run build in frontend/."}