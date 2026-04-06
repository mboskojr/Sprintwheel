import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, Boolean, DateTime
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.db.session import Base


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role = Column(String, nullable=False, default="Developer")

    is_active = Column(Boolean, nullable=False, default=True)
    left_at = Column(DateTime(timezone=True), nullable=True)
    assigned_modules = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_members_project_user"),
    )