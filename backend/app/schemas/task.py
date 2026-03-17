from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date


class TaskCreate(BaseModel):
    story_id: UUID
    assignee_id: UUID | None = None  # must match users.id type (string)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: str = "todo"



class TaskUpdate(BaseModel):
    story_id: UUID | None = None
    assignee_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = None

class TaskDateUpdate(BaseModel):
    date_completed: date | None = None

class TaskOut(BaseModel):
    id: UUID
    story_id: UUID
    assignee_id: UUID | None
    title: str
    description: str | None = None
    #isDone: bool
    status: str
    date_completed: date | None = None

    class Config:
        from_attributes = True
