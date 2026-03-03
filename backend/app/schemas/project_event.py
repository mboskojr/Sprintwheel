from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, model_validator
from uuid import UUID as PyUUID

EventType = Literal[
    "daily_scrum",
    "sprint_planning",
    "review",
    "retrospective",
    "refinement",
    "deadline",
    "milestone",
    "custom",
]

class ProjectEventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: EventType = "custom"
    start_at: datetime
    end_at: datetime

    description: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    rrule: Optional[str] = None

    @model_validator(mode="after")
    def validate_range(self):
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self
    

class ProjectEventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    type: Optional[EventType] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

    description: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    rrule: Optional[str] = None
    is_cancelled: Optional[bool] = None

    @model_validator(mode="after")
    def validate_range_if_both(self):
        if self.start_at is not None and self.end_at is not None:
            if self.end_at <= self.start_at:
                raise ValueError("end_at must be after start_at")
        return self
    

class ProjectEventOut(BaseModel):
    id: str
    project_id: PyUUID
    created_by_user_id: str

    title: str
    type: EventType
    start_at: datetime
    end_at: datetime

    description: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    rrule: Optional[str] = None

    is_cancelled: bool

    class Config:
        from_attributes = True