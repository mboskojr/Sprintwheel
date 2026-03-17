from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project_members import ProjectMember
from app.models.information_radiator import InformationRadiatorBoard, InformationRadiatorNote
from app.schemas.information_radiator import InformationRadiatorResponse, NoteCreate, NoteOut, NoteMoveRequest, NoteContentUpdate


router = APIRouter(prefix="/radiator", tags=["information_radiator"])


def require_project_member(db: Session, project_id: UUID, user_id: str) -> None:
    pm = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    if not pm:
        raise HTTPException(status_code=404, detail="Project not found")


@router.get("/{project_id}", response_model=InformationRadiatorResponse)
def get_or_create_radiator(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project_member(db, project_id, current_user.id)

    board = (
        db.query(InformationRadiatorBoard)
        .filter(InformationRadiatorBoard.project_id == project_id)
        .first()
    )

    if not board:
        board = InformationRadiatorBoard(
            project_id=project_id,
            name="Project Radiator",
        )
        db.add(board)
        db.commit()
        db.refresh(board)

    notes = (
        db.query(InformationRadiatorNote)
        .filter(
            InformationRadiatorNote.board_id == board.id,
            InformationRadiatorNote.is_archived == False,  # noqa: E712
        )
        .all()
    )

    return {
        "board": board,
        "notes": notes,
    }


@router.post("/boards/{board_id}/notes", response_model=NoteOut)
def create_note(
    board_id: str,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = (
        db.query(InformationRadiatorBoard)
        .filter(InformationRadiatorBoard.id == board_id)
        .first()
    )

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    require_project_member(db, board.project_id, current_user.id)

    note = InformationRadiatorNote(
        board_id=board_id,
        author_user_id=current_user.id,
        content=payload.content,
        color=payload.color,
        x_position=payload.x_position,
        y_position=payload.y_position,
        is_archived=False,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.patch("/notes/{note_id}/move", response_model=NoteOut)
def move_note(
    note_id: str,
    payload: NoteMoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = (
        db.query(InformationRadiatorNote)
        .filter(InformationRadiatorNote.id == note_id)
        .first()
    )

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    board = (
        db.query(InformationRadiatorBoard)
        .filter(InformationRadiatorBoard.id == note.board_id)
        .first()
    )

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    require_project_member(db, board.project_id, current_user.id)

    note.x_position = payload.x_position
    note.y_position = payload.y_position

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.patch("/notes/{note_id}/content", response_model=NoteOut)
def update_note_content(
    note_id: str,
    payload: NoteContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = (
        db.query(InformationRadiatorNote)
        .filter(InformationRadiatorNote.id == note_id)
        .first()
    )

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    board = (
        db.query(InformationRadiatorBoard)
        .filter(InformationRadiatorBoard.id == note.board_id)
        .first()
    )

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    require_project_member(db, board.project_id, current_user.id)

    note.content = payload.content

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.delete("/notes/{note_id}", response_model=NoteOut)
def archive_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = (
        db.query(InformationRadiatorNote)
        .filter(InformationRadiatorNote.id == note_id)
        .first()
    )

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    board = (
        db.query(InformationRadiatorBoard)
        .filter(InformationRadiatorBoard.id == note.board_id)
        .first()
    )

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    require_project_member(db, board.project_id, current_user.id)

    note.is_archived = True

    db.add(note)
    db.commit()
    db.refresh(note)

    return note