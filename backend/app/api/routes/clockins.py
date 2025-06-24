# backend/app/api/routes/clockins.py

from fastapi import (
    APIRouter, Depends, HTTPException, status,
    UploadFile, File, Form, Body,
)
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
from uuid import uuid4, UUID
import os

from app.database import SessionLocal
from app.models import (
    Clockin       as ClockinModel,
    ClockinHistory,
    ProjectHistory,
    Project,
    User,
    RoleEnum,
    ClockinLocation,
)
from app.api.routes.auth import get_current_user
from app.crud.clockins import get_monthly_hours, create_clockin

router = APIRouter(prefix="/clockins", tags=["clockins"])

# Carpeta de uploads
UPLOAD_DIR = "uploads/clockins"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schemas de salida ---
class ClockinOut(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    project_id: Optional[UUID]
    project_name: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    location_lat: Optional[float]
    location_long: Optional[float]
    postal_code: Optional[str]
    photo_path: Optional[str]
    approved: Optional[bool]
    created_at: datetime

    class Config:
        from_attributes = True

class MonthlyHours(BaseModel):
    month: int
    hours: float

    class Config:
        from_attributes = True

# --- Esquemas para ubicaciones ---
class LocationIn(BaseModel):
    latitude: float
    longitude: float


class LocationOut(BaseModel):
    id: UUID
    clockin_id: UUID
    user_id: UUID
    timestamp: datetime
    latitude: float
    longitude: float

    class Config:
        from_attributes = True

# --- Listado con user_name y project_name ---
@router.get("/user/{user_id}", response_model=List[ClockinOut])
def list_clockins_for_user(user_id: UUID, db: Session = Depends(get_db)):
    rows = (
        db.query(
            ClockinModel,
            User.username.label("user_name"),
            Project.name.label("project_name"),
        )
        .join(User,    ClockinModel.user_id    == User.id)
        .join(Project, ClockinModel.project_id == Project.id, isouter=True)
        .filter(ClockinModel.user_id == user_id)
        .order_by(ClockinModel.start_time.desc())
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay clockins para este usuario"
        )

    return [
        {
            "id":            clk.id,
            "user_id":       clk.user_id,
            "user_name":     uname,
            "project_id":    clk.project_id,
            "project_name":  pname,
            "start_time":    clk.start_time,
            "end_time":      clk.end_time,
            "status":        clk.status,
            "location_lat":  clk.location_lat,
            "location_long": clk.location_long,
            "postal_code":   clk.postal_code,
            "photo_path":    clk.photo_path,
            "approved":      clk.approved,
            "created_at":    clk.created_at,
        }
        for clk, uname, pname in rows
    ]

# --- Chart-data ---
@router.get("/{user_id}/chart-data", response_model=List[MonthlyHours])
def fetch_monthly_hours(user_id: UUID, db: Session = Depends(get_db)):
    data = get_monthly_hours(db, user_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay datos de horas para este usuario"
        )
    return data

# --- End clockin ---
@router.put("/end/{clockin_id}", response_model=ClockinOut)
def end_clockin_route(
    clockin_id: UUID,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    elapsed_ms = payload.get("elapsed_ms", 0)
    clk = db.query(ClockinModel).get(clockin_id)
    if not clk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clockin no encontrado")

    clk.end_time = clk.start_time + timedelta(milliseconds=elapsed_ms)
    clk.status = "completed"
    db.commit()
    db.refresh(clk)

    # insertar en project_history
    if clk.project_id:
        proj = db.get(Project, clk.project_id)
        db.add(ProjectHistory(
            id=uuid4(),
            project_id=proj.id,
            user_id=current_user.id,
            clockin_id=clk.id,
            date=datetime.utcnow(),
            status=proj.status,
            start_date=proj.start_date,
            end_date=proj.end_date,
            state=proj.state or "",
            city=proj.city or "",
            street=proj.street or "",
            street_number=proj.street_number or "",
            postal_code=proj.postal_code or ""
        ))
        db.commit()

    user_name = db.get(User, clk.user_id).username
    proj_name = proj.name if (proj := db.get(Project, clk.project_id)) else None

    return {
        "id":            clk.id,
        "user_id":       clk.user_id,
        "user_name":     user_name,
        "project_id":    clk.project_id,
        "project_name":  proj_name,
        "start_time":    clk.start_time,
        "end_time":      clk.end_time,
        "status":        clk.status,
        "location_lat":  clk.location_lat,
        "location_long": clk.location_long,
        "postal_code":   clk.postal_code,
        "photo_path":    clk.photo_path,
        "approved":      clk.approved,
        "created_at":    clk.created_at,
    }

# --- Modificar horas manualmente ---
@router.patch("/modify/{clockin_id}", response_model=ClockinOut)
def modify_clockin_hours(
    clockin_id: UUID,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clk = db.query(ClockinModel).get(clockin_id)
    if not clk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clockin no encontrado")

    hours = payload.get("hours")
    if hours is not None:
        clk.end_time = clk.start_time + timedelta(hours=float(hours))
        clk.status   = "completed"
    db.commit()
    db.refresh(clk)

    if clk.project_id:
        proj = db.get(Project, clk.project_id)
        db.add(ProjectHistory(
            id=uuid4(),
            project_id=proj.id,
            user_id=current_user.id,
            clockin_id=clk.id,
            date=datetime.utcnow(),
            status=proj.status,
            start_date=proj.start_date,
            end_date=proj.end_date,
            state=proj.state or "",
            city=proj.city or "",
            street=proj.street or "",
            street_number=proj.street_number or "",
            postal_code=proj.postal_code or ""
        ))
        db.commit()

    user_name = db.get(User, clk.user_id).username
    proj_name = proj.name if (proj := db.get(Project, clk.project_id)) else None

    return {
        "id":            clk.id,
        "user_id":       clk.user_id,
        "user_name":     user_name,
        "project_id":    clk.project_id,
        "project_name":  proj_name,
        "start_time":    clk.start_time,
        "end_time":      clk.end_time,
        "status":        clk.status,
        "location_lat":  clk.location_lat,
        "location_long": clk.location_long,
        "postal_code":   clk.postal_code,
        "photo_path":    clk.photo_path,
        "approved":      clk.approved,
        "created_at":    clk.created_at,
    }

# --- START para OFFICE (con dirección completa) ---
@router.post(
    "/photo",
    response_model=ClockinOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_office_clockin(
    project_id: UUID       = Form(...),
    latitude: float        = Form(...),
    longitude: float       = Form(...),
    state: str             = Form(...),
    city: str              = Form(...),
    street: str            = Form(...),
    street_number: str     = Form(...),
    postal_code: str       = Form(...),
    file: UploadFile       = File(...),
    db: Session            = Depends(get_db),
    current_user: User     = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(await file.read())

    clk = create_clockin(
        db,
        user_id=current_user.id,
        project_id=project_id,
        latitude=latitude,
        longitude=longitude,
        postal_code=postal_code,
        photo_path=f"/uploads/clockins/{fname}"
    )

    db.add(ClockinHistory(
        clockin_id=clk.id,
        user_id=current_user.id,
        project_id=project_id,
        state=state,
        city=city,
        street=street,
        street_number=street_number,
        postal_code=postal_code,
    ))
    db.commit()

    proj = db.get(Project, project_id)
    db.add(ProjectHistory(
        id=uuid4(),
        project_id=proj.id,
        user_id=current_user.id,
        clockin_id=clk.id,
        date=datetime.utcnow(),
        status=proj.status,
        start_date=proj.start_date,
        end_date=proj.end_date,
        state=proj.state or "",
        city=proj.city or "",
        street=proj.street or "",
        street_number=proj.street_number or "",
        postal_code=proj.postal_code or ""
    ))
    db.commit()

    user_name = current_user.username
    proj_name = proj.name

    return {
        "id":            clk.id,
        "user_id":       clk.user_id,
        "user_name":     user_name,
        "project_id":    clk.project_id,
        "project_name":  proj_name,
        "start_time":    clk.start_time,
        "end_time":      clk.end_time,
        "status":        clk.status,
        "location_lat":  clk.location_lat,
        "location_long": clk.location_long,
        "postal_code":   clk.postal_code,
        "photo_path":    clk.photo_path,
        "approved":      clk.approved,
        "created_at":    clk.created_at,
    }

# --- Delete clockin ---
@router.delete("/{clockin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clockin(
    clockin_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clk = db.query(ClockinModel).get(clockin_id)
    if not clk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clockin no encontrado")

    # Solo admin o autor
    if current_user.role != RoleEnum.admin and clk.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No autorizado")

    # Borrar foto en disco
    if clk.photo_path:
        fp = clk.photo_path.lstrip("/")
        try:
            os.remove(fp)
        except FileNotFoundError:
            pass

    # Borrar historiales asociados
    db.query(ClockinHistory).filter(ClockinHistory.clockin_id == clockin_id).delete(synchronize_session=False)
    db.query(ProjectHistory).filter(ProjectHistory.clockin_id == clockin_id).delete(synchronize_session=False)

    db.delete(clk)
    db.commit()
    return

# -------------------------------------------------
# Nuevos endpoints para registrar ubicaciones
# -------------------------------------------------

@router.post("/{clockin_id}/locations", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def add_clockin_location(
    clockin_id: UUID,
    payload: LocationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clk = db.query(ClockinModel).get(clockin_id)
    if not clk or (current_user.role != RoleEnum.admin and clk.user_id != current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clockin not found")

    loc = ClockinLocation(
        id=uuid4(),
        clockin_id=clockin_id,
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/{clockin_id}/locations", response_model=List[LocationOut])
def list_clockin_locations(
    clockin_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clk = db.query(ClockinModel).get(clockin_id)
    if not clk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clockin not found")
    if current_user.role != RoleEnum.admin and clk.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    locs = (
        db.query(ClockinLocation)
        .filter(ClockinLocation.clockin_id == clockin_id)
        .order_by(ClockinLocation.timestamp.asc())
        .all()
    )
    return locs
