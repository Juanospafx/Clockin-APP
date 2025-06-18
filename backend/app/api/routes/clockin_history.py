# backend/app/api/routes/clockin_history.py

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.database import SessionLocal
from app.models import ClockinHistory, Clockin as ClockinModel, User, Project, RoleEnum
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/clockin_history", tags=["clockin_history"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ClockinHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clockin_id: UUID
    user_id: UUID
    user_name: str
    project_id: UUID
    project_name: str
    state: str
    city: str
    street: str
    street_number: str
    postal_code: str
    start_time: datetime
    end_time: Optional[datetime]
    hours: float
    photo_path: Optional[str]
    created_at: datetime


@router.get(
    "/all",
    response_model=List[ClockinHistoryOut],
    summary="Todos los historiales (solo ADMIN)"
)
def list_history_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    rows = (
        db.query(ClockinHistory)
          .order_by(ClockinHistory.created_at.desc())
          .all()
    )

    result = []
    for h in rows:
        clk = db.get(ClockinModel, h.clockin_id)
        user = db.get(User, h.user_id)
        proj = db.get(Project, h.project_id)
        if not clk or not user or not proj:
            continue

        start = clk.start_time
        end = clk.end_time or h.created_at
        hrs = round((end - start).total_seconds() / 3600.0, 2)

        result.append({
            "id":            h.id,
            "clockin_id":    h.clockin_id,
            "user_id":       h.user_id,
            "user_name":     user.username,
            "project_id":    h.project_id,
            "project_name":  proj.name,
            "state":         h.state,
            "city":          h.city,
            "street":        h.street,
            "street_number": h.street_number,
            "postal_code":   h.postal_code,
            "start_time":    start,
            "end_time":      clk.end_time,
            "hours":         hrs,
            "photo_path":    clk.photo_path,
            "created_at":    h.created_at,
        })
    return result


@router.get(
    "/{user_id}",
    response_model=List[ClockinHistoryOut],
    summary="Historial de un usuario (field/office)"
)
def list_history_for_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Solo admin o propio usuario
    if current_user.role != RoleEnum.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    rows = (
        db.query(ClockinHistory)
          .filter(ClockinHistory.user_id == user_id)
          .order_by(ClockinHistory.created_at.desc())
          .all()
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No history for this user")

    result = []
    for h in rows:
        clk = db.get(ClockinModel, h.clockin_id)
        user = db.get(User, h.user_id)
        proj = db.get(Project, h.project_id)
        if not clk or not user or not proj:
            continue

        start = clk.start_time
        end = clk.end_time or h.created_at
        hrs = round((end - start).total_seconds() / 3600.0, 2)

        result.append({
            "id":            h.id,
            "clockin_id":    h.clockin_id,
            "user_id":       h.user_id,
            "user_name":     user.username,
            "project_id":    h.project_id,
            "project_name":  proj.name,
            "state":         h.state,
            "city":          h.city,
            "street":        h.street,
            "street_number": h.street_number,
            "postal_code":   h.postal_code,
            "start_time":    start,
            "end_time":      clk.end_time,
            "hours":         hrs,
            "photo_path":    clk.photo_path,
            "created_at":    h.created_at,
        })
    return result


@router.patch(
    "/{history_id}",
    response_model=ClockinHistoryOut,
    summary="Modificar campos de dirección de un historial"
)
def update_history_entry(
    history_id: UUID,
    payload: Dict[str, str] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    h = db.query(ClockinHistory).get(history_id)
    if not h:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "History entry not found")
    if current_user.role != RoleEnum.admin and h.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    # Actualiza solo estos campos
    for field in ("state", "city", "street", "street_number", "postal_code"):
        if field in payload:
            setattr(h, field, payload[field] or "")

    db.commit()
    db.refresh(h)

    clk = db.get(ClockinModel, h.clockin_id)
    user = db.get(User, h.user_id)
    proj = db.get(Project, h.project_id)
    start = clk.start_time
    end = clk.end_time or h.created_at
    hrs = round((end - start).total_seconds() / 3600.0, 2)

    return {
        "id":            h.id,
        "clockin_id":    h.clockin_id,
        "user_id":       h.user_id,
        "user_name":     user.username,
        "project_id":    h.project_id,
        "project_name":  proj.name,
        "state":         h.state,
        "city":          h.city,
        "street":        h.street,
        "street_number": h.street_number,
        "postal_code":   h.postal_code,
        "start_time":    start,
        "end_time":      clk.end_time,
        "hours":         hrs,
        "photo_path":    clk.photo_path,
        "created_at":    h.created_at,
    }


@router.delete(
    "/{history_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Borrar una entrada de historial"
)
def delete_history_entry(
    history_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    h = db.query(ClockinHistory).get(history_id)
    if not h:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "History entry not found")
    if current_user.role != RoleEnum.admin and h.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    db.delete(h)
    db.commit()
    return
