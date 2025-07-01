# backend/app/crud/clockins.py

import os
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, extract

from app.models import Clockin as ClockinModel, Detection as DetectionModel
# Importamos la función que inserta en project_history
from app.crud.project_history import create_history_entry

# Directorio donde se guardan las fotos de clockin/detección
UPLOAD_DIR = "uploads/clockins"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def create_clockin(
    db: Session,
    user_id: str,
    photo_path: str = None,
    project_id: str = None,
    latitude: float = None,
    longitude: float = None,
    postal_code: str = None
) -> ClockinModel:
    """
    Crea un clockin básico (para usuarios office).
    """
    # Generamos un nuevo UUID automático para el clockin
    clk = ClockinModel(
        # NOTA: no convertimos user_id a UUID(user_id) aquí
        #      porque en nuestro modelo Clockin.id es un PG_UUID generado automáticamente
        user_id=user_id,
        project_id=project_id,
        start_time=datetime.utcnow(),
        status="in_progress",
        location_lat=latitude,
        location_long=longitude,
        postal_code=postal_code,
        photo_path=photo_path
    )
    db.add(clk)
    db.commit()
    db.refresh(clk)
    return clk


def start_clockin_detection(db: Session, payload: Dict[str, Any]) -> ClockinModel:
    """
    Crea un clockin con detecciones EPP (para usuarios field).
    """
    clk = ClockinModel(
        user_id=payload["user_id"],
        project_id=payload.get("project_id"),
        start_time=datetime.utcnow(),
        status="in_progress",
        location_lat=payload.get("latitude"),
        location_long=payload.get("longitude"),
        postal_code=payload.get("postal_code"),
        photo_path=payload.get("photo_path"),
        approved=payload.get("approved", False),
    )
    db.add(clk)
    db.commit()
    db.refresh(clk)

    # Crear registros de detección
    for det in payload.get("detection", []):
        db.add(DetectionModel(
            clockin_id=clk.id,
            label=det.get("name"),
            confidence=det.get("confidence")
        ))
    db.commit()

    return clk


def get_clockins_for_user(db: Session, user_id: str) -> List[ClockinModel]:
    """
    Devuelve todos los clockins de un usuario.
    """
    return (
        db.query(ClockinModel)
        .filter(ClockinModel.user_id == user_id)
        .order_by(ClockinModel.start_time.desc())
        .all()
    )


def get_monthly_hours(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """
    Suma de horas por mes (para un usuario).
    """
    rows = (
        db.query(
            extract("month", ClockinModel.start_time).label("month"),
            func.sum(
                func.extract("epoch", ClockinModel.end_time - ClockinModel.start_time)
                / 3600
            ).label("hours"),
        )
        .filter(
            ClockinModel.user_id == user_id,
            ClockinModel.end_time.isnot(None),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": int(m), "hours": float(h) if h else 0.0} for m, h in rows]


def get_summary_data(db: Session, user_id: str) -> Dict[str, float]:
    """
    Horas totales, mensuales y semanales de UN usuario.
    """
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def hours_since(start: datetime) -> float:
        result = db.query(
            func.coalesce(
                func.sum(
                    func.extract("epoch", ClockinModel.end_time - ClockinModel.start_time)
                    / 3600
                ),
                0.0,
            )
        ).filter(
            ClockinModel.user_id == user_id,
            ClockinModel.end_time.isnot(None),
            ClockinModel.start_time >= start,
        ).scalar()
        return float(result) if result else 0.0

    return {
        "week": round(hours_since(week_start), 2),
        "month": round(hours_since(month_start), 2),
        "total": round(hours_since(datetime(1970, 1, 1)), 2),
    }


def get_summary_data_all(db: Session) -> Dict[str, float]:
    """
    Horas totales, mensuales y semanales AGREGADAS sobre TODOS los usuarios.
    """
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def hours_since(start: datetime) -> float:
        result = db.query(
            func.coalesce(
                func.sum(
                    func.extract("epoch", ClockinModel.end_time - ClockinModel.start_time)
                    / 3600
                ),
                0.0,
            )
        ).filter(
            ClockinModel.end_time.isnot(None),
            ClockinModel.start_time >= start,
        ).scalar()
        return float(result) if result else 0.0

    return {
        "week": round(hours_since(week_start), 2),
        "month": round(hours_since(month_start), 2),
        "total": round(hours_since(datetime(1970, 1, 1)), 2),
    }


def end_clockin(db: Session, clockin_id: UUID) -> ClockinModel:
    """
    Marca el clockin como completado, pone end_time y, de haber project_id,
    inserta la fila en project_history a través de create_history_entry(...).
    """
    # 1) Buscamos el clock-in por su ID
    clk = db.query(ClockinModel).get(clockin_id)
    if not clk:
        return None

    # 2) Solo si estaba en progreso, lo convertimos a 'completed'
    if clk.status == "in_progress":
        clk.end_time = func.now()
        clk.status = "completed"
        db.commit()
        db.refresh(clk)

        # 3) Si el clock-in tenía project_id, creamos la entrada en project_history
        if clk.project_id:
            # IMPORTANTE: create_history_entry espera strings (UUID en formato texto)
            # - user_id: el usuario que hizo el clock-in
            # - project_id: ID del proyecto
            # - clockin_id: ID de este clock-in
            create_history_entry(
                db,
                user_id=str(clk.user_id),
                project_id=str(clk.project_id),
                clockin_id=str(clk.id)
            )

    return clk
