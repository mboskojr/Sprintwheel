from uuid import uuid4
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from sqlalchemy.ext.mutable import MutableList

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")

    project_relation = relationship(
        "UserProject",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

class UserProject(Base):
    __tablename__ = "user_projects"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    projects = Column(MutableList.as_mutable(JSON), default=list, nullable=False)
    user = relationship("User", back_populates="project_relation")




