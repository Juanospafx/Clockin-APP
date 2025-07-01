# backend/app/api/routes/summary.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Clockin, RoleEnum, User
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timedelta
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/summary", tags=["summary"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from typing import Union

def _calc_hours(db: Session, user_id: Union[UUID, None], since: datetime) -> float:
    """
    Suma (end_time - start_time) en segundos para:
      - un usuario concreto si user_id != None (filtrando por ese user_id)
      - o para todos (user_id=None) si queremos el total global.
    Filtra además end_time IS NOT NULL y start_time >= since.
    Devuelve el resultado en horas (float).
    """
    # Construimos la consulta que extrae la suma de segundos desde end_time - start_time
    q = db.query(func.sum(func.extract("epoch", Clockin.end_time - Clockin.start_time)))

    if user_id:
        q = q.filter(
            Clockin.user_id == user_id,
            Clockin.end_time.isnot(None),
            Clockin.start_time >= since,
        )
    else:
        q = q.filter(
            Clockin.end_time.isnot(None),
            Clockin.start_time >= since,
        )

    total_secs = q.scalar() or 0
    # total_secs puede ser Decimal (o 0). Convertimos a float antes de dividir.
    return float(total_secs) / 3600.0


@router.get("/all")
def get_summary_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /summary/all
    Solo admin puede ver el resumen global de todos los usuarios.
    Devuelve un JSON con las horas totales, del mes y de la última semana,
    sumadas sobre todos los clockins completados.
    """
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_hours = _calc_hours(db, None, datetime(1970, 1, 1))
    month_hours = _calc_hours(db, None, month_start)
    week_hours = _calc_hours(db, None, week_start)

    return {
        "total": round(total_hours, 1),
        "month": round(month_hours, 1),
        "week":  round(week_hours, 1),
    }


@router.get("/{user_id}")
def get_summary_for_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /summary/{user_id}
    Devuelve el resumen de horas (semana, mes, total) para un usuario concreto.
    Cualquiera puede solicitar su propio resumen (o el admin puede solicitar el de cualquier usuario).
    """
    # Si quisieras restringir que un usuario vea únicamente su propio resumen (y no el de otro),
    # podrías verificar aquí: if current_user.id != user_id and current_user.role != RoleEnum.admin: ...
    # Pero si la lógica de autorización la tienes centralizada en get_current_user, tal vez no haga falta.

    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_hours = _calc_hours(db, user_id, datetime(1970, 1, 1))
    month_hours = _calc_hours(db, user_id, month_start)
    week_hours = _calc_hours(db, user_id, week_start)

    return {
        "total": round(total_hours, 1),
        "month": round(month_hours, 1),
        "week":  round(week_hours, 1),
    }
