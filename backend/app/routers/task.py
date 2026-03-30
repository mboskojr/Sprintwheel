from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.story import Story
from app.schemas import TaskOut, TaskCreate, TaskUpdate
from app.models.project_members import ProjectMember
from datetime import date

from app.schemas.task import TaskDateUpdate
from app.services.notification_service import notify_task_assigned, notify_assignee_changed, notify_task_status_changed
from app.models.project import Project

router = APIRouter(prefix="/tasks", tags=["tasks"])

def require_project_member(db: Session, project_id: UUID, user_id: str) -> None:
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
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
        assignee_id=data.assignee_id,
        title=data.title,
        description=data.description or "",
        status=data.status,
    )

    db.add(task)
    db.commit()
    if task.assignee_id:
        assignee = db.query(User).filter(User.id == task.assignee_id).first()
        project = db.query(Project).filter(Project.id == story.project_id).first()
        if assignee and project:
            notify_task_assigned(db, assignee.id, task.title, project.name)

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

    old_assignee_id = task.assignee_id
    old_status = task.status 

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)

    if data.assignee_id and data.assignee_id != old_assignee_id:
        new_assignee = db.query(User).filter(User.id == task.assignee_id).first()
        if new_assignee:
            notify_assignee_changed(db, new_assignee.id, task.title, new_assignee.name)
    if data.status and data.status != old_status:
        # notify assignee
        if task.assignee_id:
            notify_task_status_changed(db, task.assignee_id, task.title, task.status)
        
        # also notify all other project members
        story = db.query(Story).filter(Story.id == task.story_id).first()
        if story:
            members = db.query(ProjectMember).filter(
                ProjectMember.project_id == story.project_id
            ).all()
            for m in members:
                if str(m.user_id) != str(task.assignee_id):  # don't double-notify assignee
                    notify_task_status_changed(db, m.user_id, task.title, task.status)

    return task


'''@router.post("/{task_id}/toggle-done", response_model=TaskOut)
def toggle_story_done(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Story not found")
    
    story = db.query(Story).filter(Story.id == task.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    # Flip the boolean
    task.isDone = not task.isDone

    db.commit()
    db.refresh(task)
    return task'''

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

    db.delete(task)
    db.commit()
    return {"status": "ok"}
