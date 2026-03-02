from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserProject
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, JoinProjectIn, ProjectMembershipOut

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectOut)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=data.name,
        sprint_duration=data.sprint_duration
    )

    db.add(project)
    db.flush()

    rel = db.query(UserProject).filter(UserProject.user_id == current_user.id).first()
    if not rel:
        rel = UserProject(user_id=current_user.id, projects=[])
        db.add(rel)
        db.flush()

    rel.projects.append([str(project.id), "Product Owner"])

    db.commit()
    db.refresh(project)

    return project


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Project).all()


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.name = data.name
    project.sprint_duration = data.sprint_duration
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    rel = db.query(UserProject).filter(UserProject.user_id == current_user.id).first()
    if not rel:
        rel = UserProject(user_id=current_user.id, projects=[])
        db.add(rel)
        db.flush()

    pid = str(project_id)

    for existing in rel.projects:
        if existing and existing[0] == pid:
            raise HTTPException(status_code=400, detail="Already joined this project")

    rel.projects.append([pid, data.role])

    db.commit()
    return {"status": "ok", "project_id": pid, "role": data.role}

@router.get("/user", response_model=list[ProjectMembershipOut])
def get_user_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rel = db.query(UserProject).filter(
        UserProject.user_id == current_user.id
    ).first()

    if not rel:
        return []

    return [
        {"project_id": pid, "role": role}
        for pid, role in rel.projects
    ]