# backend/app/crud/projects.py


from sqlalchemy.orm import Session
from app import models

def get_project_by_id(db: Session, project_id: str):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_all_projects(db: Session):
    return db.query(models.Project).all()

def create_project(db: Session, name: str, description: str = None, lat: float = None, long: float = None):
    project = models.Project(name=name, description=description, location_lat=lat, location_long=long)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
