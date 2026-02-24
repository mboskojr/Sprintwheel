from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date, timedelta
from uuid import UUID
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.sprint import Sprint
from app.models.project import Project
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintOut

router = APIRouter(prefix="/sprints", tags=["sprints"])

def dateHelper(start_date : date, sprint_duration):
    return start_date + timedelta(days=sprint_duration)


@router.post("", response_model=SprintOut)
def create_sprint(
    data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    end_date = dateHelper(data.start_date, project.sprint_duration)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if end_date < data.start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")

    # optional: enforce only one active sprint per project
    if data.is_active:
        db.query(Sprint).filter(Sprint.project_id == data.project_id, Sprint.is_active == True).update(
            {"is_active": False}
        )

    existing_count = (
        db.query(func.count(Sprint.id))
        .filter(Sprint.project_id == data.project_id)
        .scalar()
    )
    sprintnum = existing_count+1

    sprint = Sprint(
        sprint_number=sprintnum,
        sprint_name=f"Sprint {sprintnum}",
        project_id=data.project_id,
        start_date=data.start_date,
        end_date=end_date,
        is_active=data.is_active,
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


@router.get("", response_model=list[SprintOut])
def list_sprints(
    project_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Sprint)
    if project_id:
        q = q.filter(Sprint.project_id == project_id)
    return q.all()


@router.get("/{sprint_id}", response_model=SprintOut)
def get_sprint(
    sprint_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@router.patch("/{sprint_id}", response_model=SprintOut)
def update_sprint(
    sprint_id: UUID,
    data: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    if data.sprint_number is not None:
        sprint.sprint_number = data.sprint_number
    max_number = (
        db.query(func.max(Sprint.sprint_number))
        .filter(Sprint.project_id == sprint.project_id)
        .scalar()
    )
    if data.sprint_name is not None:
        sprint.sprint_name = data.sprint_name
    if data.start_date is not None:
        sprint.start_date = data.start_date
    if data.end_date is not None:
        sprint.end_date = data.end_date
    if data.is_active is not None:
        # optional: only one active sprint per project
        if data.is_active:
            db.query(Sprint).filter(
                Sprint.project_id == sprint.project_id,
                Sprint.id != sprint.id,
                Sprint.is_active == True,
            ).update({"is_active": False})
        sprint.is_active = data.is_active
    if sprint.sprint_number != max_number:
        sprint.is_active = False

    if sprint.end_date < sprint.start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")

    db.commit()
    db.refresh(sprint)
    return sprint


@router.delete("/{sprint_id}")
def delete_sprint(
    sprint_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    db.delete(sprint)
    db.commit()
    return {"status": "ok"}
