# backend/app/api/routes/projects.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import uuid4, UUID
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, extract

from app.database import SessionLocal
from app.models import (
    Project      as ProjectModel,
    ProjectStatusEnum,
    Clockin,
    ProjectHistory,
    User,
    RoleEnum
)
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------
# → Pydantic Schemas
# ---------------------------------------
class ProjectBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: Optional[str] = None

    state: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    street_number: Optional[str] = None
    postal_code: Optional[str] = None

    location_lat: Optional[float] = None
    location_long: Optional[float] = None

    status: Optional[ProjectStatusEnum] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

    # total_hours is computed
    total_hours: Optional[float] = None


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None
    description: Optional[str] = None

    state: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    street_number: Optional[str] = None
    postal_code: Optional[str] = None

    location_lat: Optional[float] = None
    location_long: Optional[float] = None

    status: Optional[ProjectStatusEnum] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# ---------------------------------------
# → GET /projects
# ---------------------------------------
@router.get("/", response_model=List[ProjectRead])
def get_projects(db: Session = Depends(get_db)):
    subq = (
        db.query(
            Clockin.project_id.label("proj_id"),
            func.coalesce(
                func.sum(extract("epoch", Clockin.end_time - Clockin.start_time)) / 3600.0,
                0.0,
            ).label("total_hours"),
        )
        .filter(Clockin.end_time.isnot(None))
        .group_by(Clockin.project_id)
        .subquery()
    )

    rows = (
        db.query(ProjectModel, subq.c.total_hours)
        .outerjoin(subq, ProjectModel.id == subq.c.proj_id)
        .all()
    )

    result = []
    for project, total in rows:
        pr = ProjectRead.from_orm(project)
        pr.total_hours = round(total or 0, 2)
        result.append(pr)
    return result


# ---------------------------------------
# → GET /projects/{project_id}
# ---------------------------------------
@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    total = (
        db.query(
            func.coalesce(
                func.sum(extract("epoch", Clockin.end_time - Clockin.start_time)) / 3600.0,
                0.0,
            )
        )
        .filter(Clockin.project_id == project_id, Clockin.end_time.isnot(None))
        .scalar()
    )

    pr = ProjectRead.from_orm(proj)
    pr.total_hours = round(total or 0, 2)
    return pr


# ---------------------------------------
# → POST /projects
# ---------------------------------------
@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1) Insertar el proyecto
    proj = ProjectModel(
        id=uuid4(),
        name=payload.name,
        description=payload.description,
        state=payload.state,
        city=payload.city,
        street=payload.street,
        street_number=payload.street_number,
        postal_code=payload.postal_code,
        location_lat=payload.location_lat,
        location_long=payload.location_long,
        status=payload.status or ProjectStatusEnum.start,
        start_date=payload.start_date or datetime.utcnow(),
        end_date=payload.end_date,
        created_at=datetime.utcnow(),
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # 2) Registrar entrada en project_history
    initial_hist = ProjectHistory(
        id=uuid4(),
        project_id=proj.id,
        user_id=current_user.id,
        clockin_id=None,
        date=proj.start_date,
        status=proj.status,
        start_date=proj.start_date,
        end_date=proj.end_date,
        state=proj.state or "",
        city=proj.city or "",
        street=proj.street or "",
        street_number=proj.street_number or "",
        postal_code=proj.postal_code or "",
    )
    db.add(initial_hist)
    db.commit()

    pr = ProjectRead.from_orm(proj)
    pr.total_hours = 0.0
    return pr


# ---------------------------------------
# → PUT /projects/{project_id}
# ---------------------------------------
@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    data = payload.dict(exclude_unset=True)

    # — Detectar cambio de status y ajustar start/end dates:
    if "status" in data:
        new_status: ProjectStatusEnum = data["status"]
        # Volver a in_progress → borramos end_date
        if new_status == ProjectStatusEnum.in_progress:
            proj.status = new_status
            proj.end_date = None

        # Marcar como finished → ponemos end_date
        elif new_status == ProjectStatusEnum.finished:
            proj.status = new_status
            proj.end_date = data.get("end_date") or datetime.utcnow()

        # Resetear a start → aseguramos start_date y borramos end_date
        else:  # ProjectStatusEnum.start
            proj.status = new_status
            proj.start_date = data.get("start_date") or datetime.utcnow()
            proj.end_date = None

    # — Actualizar otros campos libres:
    for field in [
        "name", "description",
        "state", "city", "street", "street_number", "postal_code",
        "location_lat", "location_long"
    ]:
        if field in data:
            setattr(proj, field, data[field])

    # — Si vienen explícitamente fechas en el body, aplicarlas:
    if "start_date" in data:
        proj.start_date = data["start_date"]
    if "end_date" in data:
        proj.end_date = data["end_date"]

    db.commit()
    db.refresh(proj)

    # — Loguear snapshot completo en project_history:
    last_clk = (
        db.query(Clockin)
        .filter(Clockin.project_id == project_id, Clockin.end_time.isnot(None))
        .order_by(Clockin.end_time.desc())
        .first()
    )
    hist = ProjectHistory(
        id=uuid4(),
        project_id=proj.id,
        user_id=current_user.id,
        clockin_id=(last_clk.id if last_clk else None),
        date=datetime.utcnow(),
        status=proj.status,
        start_date=proj.start_date,
        end_date=proj.end_date,
        state=proj.state or "",
        city=proj.city or "",
        street=proj.street or "",
        street_number=proj.street_number or "",
        postal_code=proj.postal_code or "",
    )
    db.add(hist)
    db.commit()

    # — Recalcular total_hours
    total = (
        db.query(
            func.coalesce(
                func.sum(extract("epoch", Clockin.end_time - Clockin.start_time)) / 3600.0,
                0.0,
            )
        )
        .filter(Clockin.project_id == project_id, Clockin.end_time.isnot(None))
        .scalar()
    )

    pr = ProjectRead.from_orm(proj)
    pr.total_hours = round(total or 0, 2)
    return pr


# ---------------------------------------
# → DELETE /projects/{project_id}
# ---------------------------------------
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Solo admin puede borrar
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only admins can delete")

    proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not proj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    # Limpiar historial para no romper FKs
    db.query(ProjectHistory).filter(ProjectHistory.project_id == project_id).delete()
    db.delete(proj)
    db.commit()
    return  # 204 No Content
