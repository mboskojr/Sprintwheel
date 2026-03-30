from datetime import datetime
from uuid import UUID as PyUUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.project_event import ProjectEvent
from app.models.project_members import ProjectMember
from app.models.user import User
from app.schemas.project_event import (
    ProjectEventCreate,
    ProjectEventOut,
    ProjectEventUpdate,
)
from app.services.notification_service import notify_event_created, notify_event_updated, notify_event_cancelled

router = APIRouter(prefix="/projects", tags=["events"])


def get_project_membership(project_id: PyUUID, user: User, db: Session) -> ProjectMember:
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this project")

    return membership


def require_can_edit_events(project_id: PyUUID, user: User, db: Session) -> ProjectMember:
    membership = get_project_membership(project_id, user, db)

    if membership.role not in {
        "Product Owner",
        "Scrum Facilitator",
        "Developer",
        "Member",
    }:
        raise HTTPException(status_code=403, detail="Not authorized to manage events")

    return membership


@router.get("/{project_id}/events", response_model=list[ProjectEventOut])
def list_project_events(
    project_id: PyUUID,
    start: datetime = Query(...),
    end: datetime = Query(...),
    include_cancelled: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_project_membership(project_id, user, db)

    if end <= start:
        raise HTTPException(status_code=400, detail="end must be after start")

    filters = [
        ProjectEvent.project_id == project_id,
        ProjectEvent.start_at < end,
        ProjectEvent.end_at > start,
    ]

    if not include_cancelled:
        filters.append(ProjectEvent.is_cancelled == False)

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
    require_can_edit_events(project_id, user, db)

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
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    for m in members:
        notify_event_created(db, m.user_id, event.title, event.start_at)
    db.refresh(event)
    return event


@router.patch("/{project_id}/events/{event_id}", response_model=ProjectEventOut)
def update_event(
    project_id: PyUUID,
    event_id: str,
    payload: ProjectEventUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_can_edit_events(project_id, user, db)

    event = (
        db.query(ProjectEvent)
        .filter(
            ProjectEvent.id == event_id,
            ProjectEvent.project_id == project_id,
        )
        .first()
    )

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    data = payload.model_dump(exclude_unset=True)

    new_start = data.get("start_at", event.start_at)
    new_end = data.get("end_at", event.end_at)

    if new_end <= new_start:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")

    for key, value in data.items():
        setattr(event, key, value)

    db.add(event)
    db.commit()
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    for m in members:
        notify_event_updated(db, m.user_id, event.title)
    db.refresh(event)
    return event


@router.delete("/{project_id}/events/{event_id}", response_model=ProjectEventOut)
def cancel_event(
    project_id: PyUUID,
    event_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_can_edit_events(project_id, user, db)

    event = (
        db.query(ProjectEvent)
        .filter(
            ProjectEvent.id == event_id,
            ProjectEvent.project_id == project_id,
        )
        .first()
    )

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_cancelled = True
    db.add(event)
    db.commit()
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    for m in members:
        notify_event_cancelled(db, m.user_id, event.title)
    db.refresh(event)
    return event