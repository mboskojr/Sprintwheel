from pydantic import BaseModel, Field


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
