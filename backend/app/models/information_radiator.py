from sqlalchemy import Column, String, ForeignKey, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4

from app.db.session import Base


class InformationRadiatorBoard(Base):
    __tablename__ = "information_radiator_boards"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False, default="Project Radiator")


class InformationRadiatorNote(Base):
    __tablename__ = "information_radiator_notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    board_id = Column(String, ForeignKey("information_radiator_boards.id"), nullable=False, index=True)
    author_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    content = Column(Text, nullable=False)
    color = Column(String, nullable=False, default="yellow")

    x_position = Column(Integer, nullable=False, default=100)
    y_position = Column(Integer, nullable=False, default=100)

    is_archived = Column(Boolean, nullable=False, default=False)