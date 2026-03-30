from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(db: Session, user_id, message: str):
    notif = Notification(user_id=user_id, message=message)
    db.add(notif)
    db.commit()

def notify_added_to_project(db: Session, user_id, project_name: str, role: str):
    create_notification(db, user_id, f"You've been added to {project_name} as {role}.")

def notify_task_assigned(db: Session, user_id, task_title: str, project_name: str):
    create_notification(db, user_id, f"You've been assigned '{task_title}' in {project_name}.")

def notify_assignee_changed(db: Session, user_id, task_title: str, new_assignee_name: str):
    create_notification(db, user_id, f"Assignee for '{task_title}' changed to {new_assignee_name}.")

def notify_event_created(db: Session, user_id, event_title: str, start_at):
    create_notification(db, user_id, f"New event '{event_title}' scheduled for {start_at}.")

def notify_event_updated(db: Session, user_id, event_title: str):
    create_notification(db, user_id, f"Event '{event_title}' has been updated.")

def notify_event_cancelled(db: Session, user_id, event_title: str):
    create_notification(db, user_id, f"Event '{event_title}' has been cancelled.")

def notify_project_created(db: Session, user_id, project_name: str):
    create_notification(db, user_id, f"You created project '{project_name}'. Welcome!")

def notify_task_status_changed(db: Session, user_id, task_title: str, new_status: str):
    status_labels = {
        "todo": "To Do",
        "in_progress": "In Progress", 
        "done": "Done ✅"
    }
    label = status_labels.get(new_status, new_status)
    create_notification(db, user_id, f"Task '{task_title}' moved to {label}.")