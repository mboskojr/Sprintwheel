from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from zoneinfo import ZoneInfo

from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.project_event import ProjectEvent
from app.models.project_members import ProjectMember
from app.services.notification_service import notify_event_reminder


def _already_sent(db: Session, user_id: str, message: str) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.message == message,
            Notification.created_at >= cutoff,
        )
        .first()
        is not None
    )


def check_event_reminders():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        window_start = now + timedelta(minutes=28)
        window_end = now + timedelta(minutes=32)

        upcoming_events = (
            db.query(ProjectEvent)
            .filter(
                ProjectEvent.is_cancelled == False,
                ProjectEvent.start_at >= window_start,
                ProjectEvent.start_at <= window_end,
            )
            .all()
        )

        for event in upcoming_events:
            event_tz = event.timezone or "UTC"

            start_dt = event.start_at
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)

            local_start = start_dt.astimezone(ZoneInfo(event_tz))
            start_str = local_start.strftime("%b %d, %I:%M %p %Z")

            members = (
                db.query(ProjectMember)
                .filter(ProjectMember.project_id == event.project_id)
                .all()
            )

            for member in members:
                member_user_id = str(member.user_id)
                message = f"Reminder: '{event.title}' starts in 30 minutes ({start_str})."

                if not _already_sent(db, member_user_id, message):
                    notify_event_reminder(db, member_user_id, event.title, start_str)

        db.commit()

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        check_event_reminders,
        "interval",
        minutes=2,
        id="event_reminders",
        replace_existing=True,
    )
    return scheduler