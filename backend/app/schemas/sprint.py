from datetime import date
from pydantic import BaseModel, Field


class SprintCreate(BaseModel):
    project_id: str
    start_date: date
    end_date: date
    is_active: bool = True


class SprintUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class SprintOut(BaseModel):
    id: str
    project_id: str
    start_date: date
    end_date: date
    is_active: bool

    class Config:
        from_attributes = True
