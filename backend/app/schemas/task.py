from pydantic import BaseModel, Field
from uuid import UUID


class TaskCreate(BaseModel):
    story_id: UUID
    assignee_id: UUID | None = None  # must match users.id type (string)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None




class TaskUpdate(BaseModel):
    story_id: UUID
    assignee_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    isDone: bool | None = Field(default=False)


class TaskOut(BaseModel):
    id: UUID
    story_id: UUID
    assignee_id: UUID | None
    title: str
    description: str | None = None
    isDone: bool


    class Config:
        from_attributes = True
