import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # change task to point to story not project (for debugging purposes if errors arise)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    assignee_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    #isDone = Column(Boolean, default=False)
    status = Column(String, nullable=False, default="todo")
    position = Column(Integer, default=0)
    date_completed = Column(Date, nullable=True)
    
