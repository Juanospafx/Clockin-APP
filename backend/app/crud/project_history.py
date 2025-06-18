# backend/app/crud/project_history.py

from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app import models

def create_history_entry(db: Session, user_id: str, project_id: str, clockin_id: str):
    history = models.ProjectHistory(
        user_id=user_id,
        project_id=project_id,
        clockin_id=clockin_id,
        # Para “date” podemos usar la fecha/hora actual con func.now()
        date=func.now(),
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

def get_history_for_project(db: Session, project_id: str):
    return db.query(models.ProjectHistory).filter(models.ProjectHistory.project_id == project_id).all()
