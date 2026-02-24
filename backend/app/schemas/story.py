from pydantic import BaseModel, Field
from uuid import UUID


class StoryCreate(BaseModel):
    project_id: UUID
    sprint_id: UUID | None = None

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    points: int | None = Field(default=0, ge=0)

    priority: int = Field(default=10)


class StoryUpdate(BaseModel):
    sprint_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    points: int | None = Field(default=None, ge=0)
    isDone: bool | None = Field(default=False)
    priority: int | None = None


class StoryOut(BaseModel):
    id: UUID
    project_id: UUID
    sprint_id: UUID | None

    title: str
    description: str | None
    points: int | None

    isDone: bool
    priority: int

    class Config:
        from_attributes = True
