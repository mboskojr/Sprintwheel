from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta, timezone
from sqlalchemy.dialects.postgresql import UUID
import uuid

from pydantic import BaseModel

from app.db.session import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    join_code = Column(String, nullable=True, unique=True, index=True)
    sprint_duration = Column(Integer, nullable=False)
    project_velocity = Column(Float, nullable=False, default=0.0)

    status = Column(String, nullable=False, default="active")
    archived_at = Column(DateTime(timezone=True), nullable=True)
    delete_after = Column(DateTime(timezone=True), nullable=True)
    total_project_points = Column(Integer, nullable=False, default=0)

    stories = relationship(
        "Story",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    project_members = relationship(
        "ProjectMember",
        backref="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )