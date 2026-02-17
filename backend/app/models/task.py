import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id"), nullable=False)

    assignee_id = Column(String, ForeignKey("users.id"), nullable=True)

    title = Column(String, nullable=False)
    status = Column(String, default="todo")
    order_index = Column(Integer, default=0)
