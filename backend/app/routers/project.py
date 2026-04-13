from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.models.edu import Edu
from pydantic import BaseModel
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
    TransferOwnershipIn,
    TransferOwnershipOut, AssignModulesOut, AssignModulesIn, total_points,
)
from app.models.task import Task
from app.models.story import Story
from app.services.notification_service import notify_added_to_project, notify_project_created
from app.services.project_cleanup import delete_expired_projects

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
            is_active=True,
        )
    )

    notify_project_created(db, current_user.id, project.name)

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
        .filter(
            ProjectMember.user_id == current_user.id,
            ProjectMember.is_active == True,
        )
        .all()
    )

    return [
    ProjectListItemOut(
        id=project.id,
        name=project.name,
        sprint_duration=project.sprint_duration,
        project_velocity=project.project_velocity,
        role=role,
        status=project.status,
        archived_at=project.archived_at,
        delete_after=project.delete_after,
    )
    for project, role in rows
]

@router.post(
    "/{project_id}/members/{member_user_id}/assigned-modules/{module_id}",
    response_model=AssignModulesOut,
)
def add_module_to_member(
    project_id: UUID,
    member_user_id: str,
    module_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_membership, _ = require_active_project_member(
        db, project_id, current_user.id
    )

    target_membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == member_user_id,
            ProjectMember.is_active == True,
        )
        .first()
    )

    if not target_membership:
        raise HTTPException(status_code=404, detail="Project member not found")

    if (
        current_user.id != member_user_id
        and current_membership.role not in ["Product Owner", "Scrum Facilitator"]
    ):
        raise HTTPException(
            status_code=403,
            detail="Not allowed to assign modules for this member",
        )

    module = db.query(Edu).filter(Edu.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    current_modules = target_membership.assigned_modules or []

    if module_id in current_modules:
        return AssignModulesOut(
            status="ok",
            project_id=project_id,
            user_id=member_user_id,
            assigned_modules=current_modules,
        )

    target_membership.assigned_modules = current_modules + [module_id]

    db.commit()
    db.refresh(target_membership)

    return AssignModulesOut(
        status="ok",
        project_id=project_id,
        user_id=member_user_id,
        assigned_modules=target_membership.assigned_modules or [],
    )

@router.delete(
    "/{project_id}/members/{member_user_id}/assigned-modules/{module_id}",
    response_model=AssignModulesOut,
)
def remove_module_from_member(
    project_id: UUID,
    member_user_id: str,
    module_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_membership, _ = require_active_project_member(
        db, project_id, current_user.id
    )

    target_membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == member_user_id,
            ProjectMember.is_active == True,
        )
        .first()
    )

    if not target_membership:
        raise HTTPException(status_code=404, detail="Project member not found")

    if (
        current_user.id != member_user_id
        and current_membership.role not in ["Product Owner", "Scrum Facilitator"]
    ):
        raise HTTPException(
            status_code=403,
            detail="Not allowed to update modules for this member",
        )

    current_modules = target_membership.assigned_modules or []
    target_membership.assigned_modules = [
        mid for mid in current_modules if mid != module_id
    ]

    db.commit()
    db.refresh(target_membership)

    return AssignModulesOut(
        status="ok",
        project_id=project_id,
        user_id=member_user_id,
        assigned_modules=target_membership.assigned_modules or [],
    )


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, project = require_active_project_member(
        db, project_id, current_user.id, allow_archived=True
    )
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, project = require_active_project_member(db, project_id, current_user.id)

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
    _, project = require_active_project_member(db, project_id, current_user.id)

    avg_velocity = (
        db.query(func.coalesce(func.avg(Sprint.sprint_velocity), 0.0))
        .filter(Sprint.project_id == project_id)
        .scalar()
    )

    project.project_velocity = float(avg_velocity)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/total_points", response_model=total_points)
def update_total_points(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, project = require_active_project_member(db, project_id, current_user.id)

    tot_velocity = (
        db.query(func.coalesce(func.sum(Sprint.sprint_velocity), 0.0))
        .filter(Sprint.project_id == project_id)
        .scalar()
    )

    project.total_project_points = tot_velocity
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(
        status_code=405,
        detail="Direct project deletion is disabled. Leave or archive the project instead."
    )
    # hard deleting a project is unsafe
    # pm = (
    #     db.query(ProjectMember)
    #     .filter(
    #         ProjectMember.project_id == project_id,
    #         ProjectMember.user_id == current_user.id,
    #     )
    #     .first()
    # )
    # if not pm:
    #     raise HTTPException(status_code=404, detail="Project not found")

    # project = db.query(Project).filter(Project.id == project_id).first()
    # if not project:
    #     raise HTTPException(status_code=404, detail="Project not found")

    # db.delete(project)
    # db.commit()
    # return {"status": "ok"}


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

    if existing and existing.is_active:
        raise HTTPException(status_code=400, detail="Already joined this project")

    if existing and not existing.is_active:
        existing.is_active = True
        existing.left_at = None
        existing.role = data.role.value
        db.flush()
    else: 
        db.add(
            ProjectMember(
                project_id=project_id,
                user_id=current_user.id,
                role=data.role.value,
                is_active=True,
            )
        )
    if project.status == "archived":
        project.status = "active"
        project.archived_at = None
        project.delete_after = None

    notify_added_to_project(db, current_user.id, project.name, data.role.value)

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
    membership, _ = require_active_project_member(db, project_id, current_user.id)

    if data.role.value == "Product Owner":
        existing_product_owner = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.is_active == True,
                ProjectMember.role == "Product Owner",
                ProjectMember.user_id != current_user.id,
            )
            .first()
        )

        if existing_product_owner:
            raise HTTPException(
                status_code=400,
                detail="This project already has a Product Owner.",
            )
    
    if data.role.value == "Scrum Facilitator":
        existing_scrum_master = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.is_active == True,
                ProjectMember.role == "Scrum Facilitator",
                ProjectMember.user_id != current_user.id,
            )
            .first()
        )

        if existing_scrum_master:
            raise HTTPException(
                status_code=400,
                detail="This project already has a Scrum Facilitator.",
            )
        
    if membership.role == data.role.value:
        return UpdateRoleOut(
            status="ok",
            project_id=project_id,
            user_id=current_user.id,
            role=data.role,
        )

    membership.role = data.role.value
    db.commit()
    db.refresh(membership)

    return UpdateRoleOut(
        status="ok",
        project_id=project_id,
        user_id=current_user.id,
        role=data.role,
    )


def require_active_project_member(
    db: Session,
    project_id: UUID,
    user_id: str,
    allow_archived: bool = False,
):
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
            ProjectMember.is_active == True,
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=404, detail="Project not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not allow_archived and project.status == "archived":
        raise HTTPException(status_code=400, detail="Project is archived")

    return membership, project


@router.get("/{project_id}/board")
def get_project_board(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_active_project_member(db, project_id, current_user.id)

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


@router.get("/{project_id}/members")
def get_project_members(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_active_project_member(db, project_id, current_user.id)
    
    rows = (
        db.query(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.is_active == True,
        )
        .all()
    )
    
    return [
        {
            "user_id": str(pm.user_id),
            "name": user.name,
            "email": user.email,
            "role": pm.role,
        }
        for pm, user in rows
    ]


@router.patch("/{project_id}/transfer-ownership", response_model=TransferOwnershipOut)
def transfer_ownership(
    project_id: UUID,
    data: TransferOwnershipIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_membership, project = require_active_project_member(
        db, project_id, current_user.id
    )

    if current_membership.role != "Product Owner":
        raise HTTPException(
            status_code=403,
            detail="Only the Product Owner can transfer ownership.",
        )

    if data.new_owner_user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You already own this project.",
        )

    target_membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == data.new_owner_user_id,
            ProjectMember.is_active == True,
        )
        .first()
    )

    if not target_membership:
        raise HTTPException(
            status_code=404,
            detail="New owner must be an active member of this project.",
        )

    current_membership.role = "Developer"
    target_membership.role = "Product Owner"

    db.commit()

    return TransferOwnershipOut(
        status="ok",
        project_id=project_id,
        previous_owner_user_id=current_user.id,
        new_owner_user_id=data.new_owner_user_id,
    )


@router.post("/{project_id}/leave")
def leave_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership, project = require_active_project_member(
        db, project_id, current_user.id, allow_archived=True
    )

    if membership.role == "Product Owner":
        active_count = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.is_active == True,
            )
            .count()
        )

        if active_count > 1:
            raise HTTPException(
                status_code=400,
                detail="Product Owner must transfer ownership before leaving.",
            )

    tasks = (
        db.query(Task)
        .join(Story, Story.id == Task.story_id)
        .filter(
            Story.project_id == project_id,
            Task.assignee_id == current_user.id,
            Task.status != "done",
        )
        .all()
    )

    for task in tasks:
        task.assignee_id = None

    now = datetime.now(timezone.utc)
    membership.is_active = False
    membership.left_at = now

    db.flush()   # important: pushes the membership update before counting

    remaining = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.is_active == True,
        )
        .count()
    )

    if remaining == 0:
        project.status = "archived"
        project.archived_at = now
        project.delete_after = now + timedelta(days=30)

    db.commit()

    return {"status": "left_project"}


@router.post("/cleanup-expired")
def cleanup_expired_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted_count = delete_expired_projects(db)

    return {
        "status": "ok",
        "deleted_projects": deleted_count,
    }