from sqlalchemy import Column, String, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.session import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    sprint_id = Column(UUID(as_uuid=True), ForeignKey("sprints.id"), nullable=True)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    points = Column(Integer, nullable=True)

    isDone = Column(Boolean, default=False)
    priority = Column(Integer, default=10)
