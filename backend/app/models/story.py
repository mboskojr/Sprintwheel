from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.session import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    sprint_id = Column(UUID(as_uuid=True), ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    points = Column(Integer, nullable=True)

    isDone = Column(Boolean, default=False)
    priority = Column(Integer, default=10)
    date_completed = Column(Date, nullable=True)
    date_added = Column(Date, nullable=True)

    project = relationship("Project", back_populates="stories")