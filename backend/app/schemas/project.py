from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID
from enum import Enum


class ProjectRole(str, Enum):
    product_owner = "Product Owner"
    scrum_facilitator = "Scrum Facilitator"
    developer = "Developer"


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    sprint_duration: int = Field(default=7)


class ProjectUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    sprint_duration: int = Field(default=7)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    sprint_duration: int
    project_velocity: float
    status: str
    archived_at: Optional[datetime] = None
    delete_after: Optional[datetime] = None


class ProjectListItemOut(BaseModel):
    id: UUID
    name: str
    sprint_duration: int
    project_velocity: float
    role: ProjectRole
    status: str
    archived_at: Optional[datetime] = None
    delete_after: Optional[datetime] = None


class JoinProjectIn(BaseModel):
    role: ProjectRole


class ProjectMembershipOut(BaseModel):
    project_id: UUID
    role: ProjectRole


class UpdateRoleIn(BaseModel):
    role: ProjectRole


class UpdateRoleOut(BaseModel):
    status: str
    project_id: UUID
    user_id: str
    role: ProjectRole

class TransferOwnershipIn(BaseModel):
    new_owner_user_id: str

class TransferOwnershipOut(BaseModel):
    status: str
    project_id: UUID
    previous_owner_user_id: str
    new_owner_user_id: str