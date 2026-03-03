from datetime import datetime
from uuid import UUID as PyUUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project_event import ProjectEvent
from app.schemas.project_event import ProjectEventCreate, ProjectEventUpdate, ProjectEventOut

router = APIRouter(prefix="/projects", tags=["events"])


def require_can_edit_events(user: User) -> None:
    if user.role not in {"admin", "product_owner", "scrum_master"}:
        raise HTTPException(status_code=403, detail="Not authorized to manage events")
    

@router.get("/{project_id}/events", response_model=list[ProjectEventOut])
def list_project_events(
    project_id: PyUUID,
    start: datetime = Query(...),
    end: datetime = Query(...),
    include_cancelled: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if end <= start:
        raise HTTPException(status_code=400, detail="end must be after start")

    filters = [
        ProjectEvent.project_id == project_id,
        ProjectEvent.start_at < end,
        ProjectEvent.end_at > start,
    ]
    if not include_cancelled:
        filters.append(ProjectEvent.is_cancelled == False)  # noqa: E712

    return (
        db.query(ProjectEvent)
        .filter(and_(*filters))
        .order_by(ProjectEvent.start_at.asc())
        .all()
    )


@router.post("/{project_id}/events", response_model=ProjectEventOut, status_code=201)
def create_project_event(
    project_id: PyUUID,
    payload: ProjectEventCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_can_edit_events(user)

    event = ProjectEvent(
        project_id=project_id,
        created_by_user_id=user.id,
        title=payload.title,
        type=payload.type,
        start_at=payload.start_at,
        end_at=payload.end_at,
        description=payload.description,
        location=payload.location,
        timezone=payload.timezone,
        rrule=payload.rrule,
        is_cancelled=False,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.patch("/events/{event_id}", response_model=ProjectEventOut)
def update_event(
    event_id: str,
    payload: ProjectEventUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_can_edit_events(user)

    event = db.query(ProjectEvent).filter(ProjectEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    data = payload.model_dump(exclude_unset=True)

    new_start = data.get("start_at", event.start_at)
    new_end = data.get("end_at", event.end_at)
    if new_end <= new_start:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")

    for k, v in data.items():
        setattr(event, k, v)

    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{event_id}", response_model=ProjectEventOut)
def cancel_event(
    event_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_can_edit_events(user)

    event = db.query(ProjectEvent).filter(ProjectEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_cancelled = True
    db.add(event)
    db.commit()
    db.refresh(event)
    return event