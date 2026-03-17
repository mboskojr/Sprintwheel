from pydantic import BaseModel, Field
from typing import Literal
from uuid import UUID


NoteColor = Literal["red", "green", "yellow", "blue", "purple"]


class NoteCreate(BaseModel):
    content: str = Field(min_length=1)
    color: NoteColor = "yellow"
    x_position: int = Field(default=100, ge=0)
    y_position: int = Field(default=100, ge=0)


class NoteContentUpdate(BaseModel):
    content: str = Field(min_length=1)


class NoteMoveRequest(BaseModel):
    x_position: int = Field(ge=0)
    y_position: int = Field(ge=0)


class NoteOut(BaseModel):
    id: str
    board_id: str
    author_user_id: str
    content: str
    color: NoteColor
    x_position: int
    y_position: int
    is_archived: bool

    class Config:
        from_attributes = True


class InformationRadiatorBoardOut(BaseModel):
    id: str
    project_id: UUID
    name: str

    class Config:
        from_attributes = True


class InformationRadiatorResponse(BaseModel):
    board: InformationRadiatorBoardOut
    notes: list[NoteOut]