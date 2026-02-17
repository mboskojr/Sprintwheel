from sqlalchemy import Column, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.session import Base

class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
