from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.database import SessionLocal
from app.models import (
    ProjectHistory,
    Clockin,
    User,
    Project,
    ProjectStatusEnum,
    RoleEnum,
)
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/project_history", tags=["project_history"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ProjectHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clockin_id: Optional[UUID]
    user_id: Optional[UUID]
    user_name: str

    project_id: UUID
    project_name: str
    status: ProjectStatusEnum

    state: str
    city: str
    street: str
    street_number: str
    postal_code: str

    start_date: datetime
    end_date: Optional[datetime]
    hours: float  # aquí puede ser total o individual

@router.get("/", response_model=List[ProjectHistoryOut])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    → Admin: ve todo.
    → Office/Field: sólo sus ProjectHistory.

    Por cada proyecto:
      1) Fila TOTAL con horas acumuladas (todos o sólo del user).
      2) Filas individuales con horas de cada clockin.
    """
    # 1) Leemos todas las entradas de history (filtro por user si no es admin)
    q = db.query(ProjectHistory)
    if current_user.role != RoleEnum.admin:
        q = q.filter(ProjectHistory.user_id == current_user.id)
    history_rows = q.order_by(ProjectHistory.date.desc()).all()

    if not history_rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No history entries found")

    # 2) Agrupamos por proyecto
    by_proj: dict[UUID, List[ProjectHistory]] = {}
    for h in history_rows:
        by_proj.setdefault(h.project_id, []).append(h)

    out: List[ProjectHistoryOut] = []

    for proj_id, hist_list in by_proj.items():
        proj = db.get(Project, proj_id)
        if not proj:
            continue

        # 3) Calculamos total acumulado
        total_q = db.query(
            func.coalesce(
                func.sum(extract("epoch", Clockin.end_time - Clockin.start_time)),
                0.0
            )
        ).filter(
            Clockin.project_id == proj.id,
            Clockin.end_time.isnot(None)
        )
        if current_user.role != RoleEnum.admin:
            total_q = total_q.filter(Clockin.user_id == current_user.id)

        total_secs = float(total_q.scalar() or 0.0)
        total_hours = round(total_secs / 3600.0, 2)

        # 4) Fila aggregate / TOTAL
        out.append({
            "id":            proj.id,            # reutilizamos project_id como id
            "clockin_id":    None,
            "user_id":       None,
            "user_name":     "TOTAL",
            "project_id":    proj.id,
            "project_name":  proj.name,
            "status":        proj.status,
            "state":         proj.state or "",
            "city":          proj.city or "",
            "street":        proj.street or "",
            "street_number": proj.street_number or "",
            "postal_code":   proj.postal_code or "",
            "start_date":    proj.start_date,
            "end_date":      proj.end_date,
            "hours":         total_hours,
        })

        # 5) Filas individuales
        for h in hist_list:
            user = db.get(User, h.user_id)
            uname = user.username if user else ""

            # calculamos horas de este clockin
            if h.clockin_id:
                clk = db.get(Clockin, h.clockin_id)
                if clk and clk.end_time:
                    ind_secs = (clk.end_time - clk.start_time).total_seconds()
                else:
                    ind_secs = 0.0
            else:
                ind_secs = 0.0
            ind_hours = round(ind_secs / 3600.0, 2)

            out.append({
                "id":            h.id,
                "clockin_id":    h.clockin_id,
                "user_id":       h.user_id,
                "user_name":     uname,
                "project_id":    proj.id,
                "project_name":  proj.name,
                "status":        proj.status,
                "state":         proj.state or "",
                "city":          proj.city or "",
                "street":        proj.street or "",
                "street_number": proj.street_number or "",
                "postal_code":   proj.postal_code or "",
                "start_date":    proj.start_date,
                "end_date":      proj.end_date,
                "hours":         ind_hours,
            })
    return out
