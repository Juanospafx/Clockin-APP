from sqlalchemy.orm import Session
from app import models

def get_user_by_id(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, username: str, email: str = None):
    user = models.User(username=username, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
