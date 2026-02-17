from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.story import Story
from app.models.project import Project
from app.models.sprint import Sprint

router = APIRouter(prefix="/stories", tags=["stories"])


class StoryCreate(BaseModel):
    project_id: str
    sprint_id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    points: int | None = Field(default=None, ge=0)
    status: str = Field(default="todo", max_length=50)
    priority: int = Field(default=0)


class StoryUpdate(BaseModel):
    sprint_id: str | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    points: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=50)
    priority: int | None = None


class StoryOut(BaseModel):
    id: str
    project_id: str
    sprint_id: str | None
    title: str
    description: str | None
    points: int | None
    status: str
    priority: int

    class Config:
        from_attributes = True


@router.post("", response_model=StoryOut)
def create_story(
    data: StoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.sprint_id is not None:
        sprint = db.query(Sprint).filter(Sprint.id == data.sprint_id).first()
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found")
        if str(sprint.project_id) != str(data.project_id):
            raise HTTPException(status_code=400, detail="Sprint does not belong to project")

    story = Story(
        project_id=data.project_id,
        sprint_id=data.sprint_id,
        title=data.title,
        description=data.description,
        points=data.points,
        status=data.status,
        priority=data.priority,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


@router.get("", response_model=list[StoryOut])
def list_stories(
    project_id: str | None = None,
    sprint_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Story)
    if project_id:
        q = q.filter(Story.project_id == project_id)
    if sprint_id is not None:
        q = q.filter(Story.sprint_id == sprint_id)
    return q.order_by(Story.priority.desc()).all()


@router.get("/{story_id}", response_model=StoryOut)
def get_story(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.patch("/{story_id}", response_model=StoryOut)
def update_story(
    story_id: str,
    data: StoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    if data.sprint_id is not None:
        sprint = db.query(Sprint).filter(Sprint.id == data.sprint_id).first()
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found")
        if str(sprint.project_id) != str(story.project_id):
            raise HTTPException(status_code=400, detail="Sprint does not belong to story's project")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(story, k, v)

    db.commit()
    db.refresh(story)
    return story


@router.post("/{story_id}/assign-sprint/{sprint_id}", response_model=StoryOut)
def assign_story_to_sprint(
    story_id: str,
    sprint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    if str(sprint.project_id) != str(story.project_id):
        raise HTTPException(status_code=400, detail="Sprint does not belong to story's project")

    story.sprint_id = sprint_id
    db.commit()
    db.refresh(story)
    return story


@router.post("/{story_id}/unassign-sprint", response_model=StoryOut)
def unassign_story_from_sprint(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    story.sprint_id = None
    db.commit()
    db.refresh(story)
    return story


@router.delete("/{story_id}")
def delete_story(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    db.delete(story)
    db.commit()
    return {"status": "ok"}
