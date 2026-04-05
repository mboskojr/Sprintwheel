from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4

from app.db.session import Base

class ProjectEvent(Base):
    __tablename__ = "project_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)

    type = Column(String, nullable=False, default="custom")

    start_at = Column(DateTime, nullable=False, index=True)
    end_at = Column(DateTime, nullable=False, index=True)

    timezone = Column(String, nullable=True)
    rrule = Column(String, nullable=True)

    is_cancelled = Column(Boolean, nullable=False, default=False)