from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.story import Story
from app.models.project import Project
from app.models.sprint import Sprint
from app.schemas import StoryCreate, StoryUpdate, StoryOut
from app.models.project_members import ProjectMember
from app.schemas.story import StoryReorderRequest, StoryPointsUpdate, StoryDateUpdate

router = APIRouter(prefix="/stories", tags=["stories"])

def require_project_member(db: Session, project_id: UUID, user_id: str) -> None:
    pm = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id)
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")


@router.post("", response_model=StoryOut)
def create_story(
    data: StoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project_member(db, data.project_id, current_user.id)
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
        isDone=False,
        priority=data.priority,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


@router.post("/backlog", response_model=StoryOut)
def create_backlog_story(
    data: StoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if data.sprint_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Backlog stories cannot be assigned to a sprint",
        )
    
    max_priority = (
        db.query(Story.priority)
        .filter(
            Story.project_id == data.project_id,
            Story.sprint_id.is_(None),
        )
        .order_by(Story.priority.desc())
        .first()
    )
    next_priority = max_priority[0] + 1 if max_priority else 1

    story = Story(
        project_id=data.project_id,
        sprint_id=None,
        title=data.title,
        description=data.description,
        points=data.points,
        status=data.status,
        priority=next_priority,
    )

    db.add(story)
    db.commit()
    db.refresh(story)
    return story


@router.get("", response_model=list[StoryOut])
def list_stories(
    project_id: UUID | None = None,
    sprint_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    require_project_member(db, project_id, current_user.id)
    q = db.query(Story)
    if project_id:
        q = q.filter(Story.project_id == project_id)
    if sprint_id is not None:
        q = q.filter(Story.sprint_id == sprint_id)
    return q.order_by(Story.priority.desc()).all()


@router.get("/backlog", response_model=list[StoryOut])
def get_product_backlog(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Story)
        .filter(
            Story.project_id == project_id,
            Story.sprint_id.is_(None),
        )
        .order_by(Story.priority.desc())
        .all()
    )


@router.put("/backlog/reorder")
def reorder_backlog(
    data: StoryReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stories = (
        db.query(Story)
        .filter(
            Story.id.in_(data.ordered_ids),
            Story.sprint_id.is_(None),
        )
        .all()
    )

    if len(stories) != len(data.ordered_ids):
        raise HTTPException(status_code=400, detail="Invalid story IDs")
    
    project_ids = {story.project_id for story in stories}
    if len(project_ids) != 1:
        raise HTTPException(status_code=400, detail="All backlog stories must belong to the same project")
    
    story_map = {story.id: story for story in stories}

    for index, story_id in enumerate(data.ordered_ids):
        story_map[story_id].priority = len(data.ordered_ids) - index
    
    db.commit()
    return {"status": "success"}


@router.get("/{story_id}", response_model=StoryOut)
def get_story(
    story_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    require_project_member(db, story.project_id, current_user.id)
    return story


@router.patch("/{story_id}", response_model=StoryOut)
def update_story(
    story_id: UUID,
    data: StoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    require_project_member(db, story.project_id, current_user.id)

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
    story_id: UUID,
    sprint_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    require_project_member(db, story.project_id, current_user.id)

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
    story_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    require_project_member(db, story.project_id, current_user.id)

    story.sprint_id = None
    db.commit()
    db.refresh(story)
    return story


@router.post("/{story_id}/toggle-done", response_model=StoryOut)
def toggle_story_done(
    story_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    require_project_member(db, story.project_id, current_user.id)

    sprint = None
    if story.sprint_id is not None:
        sprint = db.query(Sprint).filter(Sprint.id == story.sprint_id).first()

    points = story.points or 0

    if story.isDone:
        story.isDone = False
        story.date_completed = None
        if sprint is not None:
            sprint.sprint_velocity -= points
            if sprint.sprint_velocity < 0:
                sprint.sprint_velocity = 0
    else:
        story.isDone = True
        story.date_completed = date.today()
        if sprint is not None:
            sprint.sprint_velocity += points

    db.commit()
    db.refresh(story)
    return story


@router.patch("/{story_id}/points", response_model=StoryOut)
def update_story_points(
    story_id: UUID,
    data: StoryPointsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    story.points = data.points

    db.commit()
    db.refresh(story)

    return story




@router.patch("/{story_id}/date", response_model=StoryOut)
def update_story_date_completed(
    story_id: UUID,
    data: StoryDateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    require_project_member(db, story.project_id, current_user.id)

    story.date_completed = data.date_completed

    db.commit()
    db.refresh(story)

    return story


@router.delete("/{story_id}")
def delete_story(
    story_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    require_project_member(db, story.project_id, current_user.id)

    db.delete(story)
    db.commit()
    return {"status": "ok"}


