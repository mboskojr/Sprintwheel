from datetime import date
from pydantic import BaseModel, Field
from uuid import UUID


class SprintCreate(BaseModel):
    project_id: UUID
    start_date: date
    is_active: bool = True


class SprintUpdate(BaseModel):
    sprint_number: int | None = None
    sprint_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class SprintOut(BaseModel):
    id: UUID
    sprint_number: int
    sprint_name: str
    project_id: UUID
    start_date: date
    end_date: date
    is_active: bool

    class Config:
        from_attributes = True
