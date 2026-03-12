from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.sprint import Sprint
from app.models.project_members import ProjectMember
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectOut,
    ProjectListItemOut,
    JoinProjectIn,
    UpdateRoleIn,
    UpdateRoleOut,
)
from app.models.task import Task
from app.models.story import Story

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectOut)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=data.name,
        sprint_duration=data.sprint_duration,
    )
    db.add(project)
    db.flush()

    #default board story 
    story = Story(
    project_id=project.id,
    title="Main Board"
    )
    db.add(story)

    db.add(
        ProjectMember(
            project_id=project.id,
            user_id=current_user.id,
            role="Product Owner",
        )
    )

    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectListItemOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Project, ProjectMember.role)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .filter(ProjectMember.user_id == current_user.id)
        .all()
    )

    return [
        ProjectListItemOut(
            id=project.id,
            name=project.name,
            sprint_duration=project.sprint_duration,
            project_velocity=project.project_velocity,
            role=role,
        )
        for project, role in rows
    ]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.name = data.name
    project.sprint_duration = data.sprint_duration
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/velocity", response_model=ProjectOut)
def update_project_velocity(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    avg_velocity = (
        db.query(func.coalesce(func.avg(Sprint.sprint_velocity), 0.0))
        .filter(Sprint.project_id == project_id)
        .scalar()
    )

    project.project_velocity = float(avg_velocity)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"status": "ok"}


@router.post("/{project_id}/join")
def join_project(
    project_id: UUID,
    data: JoinProjectIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already joined this project")

    db.add(
        ProjectMember(
            project_id=project_id,
            user_id=current_user.id,
            role=data.role.value,
        )
    )
    db.commit()

    return {
        "status": "ok",
        "project_id": project_id,
        "role": data.role,
    }


@router.patch("/{project_id}/role", response_model=UpdateRoleOut)
def update_role(
    project_id: UUID,
    data: UpdateRoleIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this project")

    membership.role = data.role.value
    db.commit()
    db.refresh(membership)

    return UpdateRoleOut(
        status="ok",
        project_id=project_id,
        user_id=current_user.id,
        role=data.role,
    )


def require_project_member(db: Session, project_id: UUID, user_id: str):
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

@router.get("/{project_id}/board")
def get_project_board(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_project_member(db, project_id, current_user.id)

    # get first story in project 
    story = (
        db.query(Story)
        .filter(Story.project_id == project_id)
        .first()
    )

    if not story:
        story = Story(
            project_id=project_id,
            title="Main Board"
        )
        db.add(story)
        db.commit()
        db.refresh(story)

    tasks = (
        db.query(Task)
        .filter(Task.story_id == story.id)
        .all()
    )

    board = {
        "todo": [],
        "in_progress": [],
        "done": []
    }

    for task in tasks:
        if task.status in board:
            board[task.status].append(task)

    return {
        "story_id": story.id,
        "todo": board["todo"],
        "in_progress": board["in_progress"],
        "done": board["done"]
    }