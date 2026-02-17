from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.story import Story

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    story_id: str
    title: str = Field(min_length=1, max_length=200)
    status: str = Field(default="todo", max_length=50)
    assignee_id: str | None = None  # must match users.id type (string)
    order_index: int = 0


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    status: str | None = Field(default=None, max_length=50)
    assignee_id: str | None = None
    order_index: int | None = None


class TaskOut(BaseModel):
    id: str
    story_id: str
    title: str
    status: str
    assignee_id: str | None
    order_index: int

    class Config:
        from_attributes = True


@router.post("", response_model=TaskOut)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == data.story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    task = Task(
        story_id=data.story_id,
        title=data.title,
        status=data.status,
        assignee_id=data.assignee_id,
        order_index=data.order_index,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    story_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task)
    if story_id:
        q = q.filter(Task.story_id == story_id)
    return q.order_by(Task.order_index.asc()).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"status": "ok"}
