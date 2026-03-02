from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID

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
    
class JoinProjectIn(BaseModel):
    role: str

class ProjectMembershipOut(BaseModel):
    project_id: str
    role: str