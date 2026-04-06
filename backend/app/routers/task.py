from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.story import Story
from app.schemas import TaskOut, TaskCreate, TaskUpdate
from app.models.project_members import ProjectMember
from app.schemas.task import TaskDateUpdate
from app.services.notification_service import (
    notify_task_assigned,
    notify_task_status_changed,
    notify_task_deleted,
)
from app.models.project import Project

router = APIRouter(prefix="/tasks", tags=["tasks"])


def require_project_member(db: Session, project_id: UUID, user_id: str) -> None:
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == str(user_id),
        )
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")


@router.post("", response_model=TaskOut)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == data.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    task = Task(
        story_id=data.story_id,
        assignee_id=str(data.assignee_id) if data.assignee_id else None,
        title=data.title,
        description=data.description or "",
        status=data.status,
    )

    if hasattr(task, "position") and hasattr(data, "position"):
        task.position = data.position

    db.add(task)

    if task.assignee_id:
        assignee = db.query(User).filter(User.id == str(task.assignee_id)).first()
        project = db.query(Project).filter(Project.id == story.project_id).first()
        if assignee and project:
            notify_task_assigned(db, assignee.id, task.title, project.name)

    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    story_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not story_id:
        raise HTTPException(status_code=400, detail="story_id is required")

    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    return db.query(Task).filter(Task.story_id == story_id).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    story = db.query(Story).filter(Story.id == task.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    story = db.query(Story).filter(Story.id == task.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    project = db.query(Project).filter(Project.id == story.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)

    old_status = task.status

    if "assignee_id" in update_data:
        update_data["assignee_id"] = (
            str(update_data["assignee_id"]) if update_data["assignee_id"] else None
        )

    for k, v in update_data.items():
        setattr(task, k, v)

    if "assignee_id" in update_data and task.assignee_id:
        assignee = db.query(User).filter(User.id == str(task.assignee_id)).first()
        if assignee:
            notify_task_assigned(db, assignee.id, task.title, project.name)

    if "status" in update_data and task.status != old_status:
        if task.assignee_id:
            notify_task_status_changed(db, task.assignee_id, task.title, task.status)

        members = db.query(ProjectMember).filter(
            ProjectMember.project_id == story.project_id
        ).all()

        for m in members:
            if str(m.user_id) != str(task.assignee_id):
                notify_task_status_changed(db, str(m.user_id), task.title, task.status)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete-date", response_model=TaskOut)
def set_task_completed_date(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    story = db.query(Story).filter(Story.id == task.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)
    task.date_completed = date.today()

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/set-date", response_model=TaskOut)
def update_task_completed_date(
    task_id: UUID,
    data: TaskDateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    story = db.query(Story).filter(Story.id == task.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)
    task.date_completed = data.date_completed

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    story = db.query(Story).filter(Story.id == task.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    project = db.query(Project).filter(Project.id == story.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task_title = task.title
    project_name = project.name

    members = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == story.project_id)
        .all()
    )

    db.delete(task)

    for m in members:
        notify_task_deleted(db, str(m.user_id), task_title, project_name)

    db.commit()
    return {"status": "ok"}
