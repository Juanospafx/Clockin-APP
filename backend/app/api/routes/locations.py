from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Optional

from app.database import SessionLocal
from app.models import UserLocation, User
from app.api.routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/locations", tags=["locations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class LocationCreate(BaseModel):
    latitude: float
    longitude: float
    clockin_id: Optional[UUID] = None

class LocationOut(BaseModel):
    id: UUID
    user_id: UUID
    clockin_id: Optional[UUID]
    latitude: float
    longitude: float
    timestamp: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=LocationOut)
def create_location(data: LocationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    loc = UserLocation(
        user_id=current_user.id,
        clockin_id=data.clockin_id,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc

@router.get("/all", response_model=List[LocationOut])
def all_locations(db: Session = Depends(get_db)):
    return db.query(UserLocation).order_by(UserLocation.timestamp.desc()).all()

@router.get("/clockin/{clockin_id}", response_model=List[LocationOut])
def clockin_locations(clockin_id: UUID, db: Session = Depends(get_db)):
    return db.query(UserLocation).filter(UserLocation.clockin_id == clockin_id).order_by(UserLocation.timestamp.asc()).all()
