from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.project import Project


def delete_expired_projects(db: Session) -> int:
    now = datetime.now(timezone.utc)

    expired_projects = (
        db.query(Project)
        .filter(
            Project.status == "archived",
            Project.delete_after.isnot(None),
            Project.delete_after <= now,
        )
        .all()
    )

    count = len(expired_projects)

    for project in expired_projects:
        db.delete(project)

    db.commit()
    return count