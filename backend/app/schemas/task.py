from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    story_id: str

    title: str = Field(min_length=1, max_length=200)
    status: str = Field(default="todo", max_length=50)

    assignee_id: str | None = None  # must match users.id type (string)
    order_index: int = 0


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    status: str | None = Field(default=None, max_length=50)
    assignee_id: str | None = None
    order_index: int | None = None


class TaskOut(BaseModel):
    id: str
    story_id: str
    title: str
    status: str
    assignee_id: str | None
    order_index: int

    class Config:
        from_attributes = True
