# backend/app/api/routes/detection.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import uuid4
import os
import redis
from datetime import datetime

from app.database import SessionLocal
from app.crud.clockins import create_clockin, start_clockin_detection
from app.worker import run_detection, celery_app
from celery.result import AsyncResult
from app.models import User, RoleEnum
from app.api.routes.auth import get_current_user

# Configuración
UPLOAD_DIR = "uploads/clockins"
os.makedirs(UPLOAD_DIR, exist_ok=True)
redis_client = redis.Redis(host="localhost", port=6379, db=0)

router = APIRouter(prefix="/detection", tags=["detection"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/clockins/{user_id}/photo", status_code=status.HTTP_201_CREATED)
async def upload_photo_only(
    user_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint para todos los usuarios: sube foto y arranca clockin sin modelo.
    """
    # Guardamos la imagen
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(await file.read())

    # Creamos el clockin directamente
    clockin = create_clockin(
        db,
        user_id=user_id,
        photo_path=f"/uploads/clockins/{fname}"
    )
    return clockin

@router.post("/clockins/{user_id}/detect", status_code=status.HTTP_201_CREATED)
async def detect_and_clockin(
    user_id: str,
    file: UploadFile = File(...),
    project_id: str = None,
    latitude: float = None,
    longitude: float = None,
    state: str = "",
    city: str = "",
    street: str = "",
    street_number: str = "",
    postal_code: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ahora también para field: si es field, creamos clockin de inmediato;
    si es office/admin, igual funciona aquí.
    """
    # Leemos y guardamos la imagen
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)

    # Si quieres seguir pasando por Celery en el futuro, podrías usar run_detection aquí.
    # Pero por ahora, para todos los roles, creamos el clockin directamente:
    clockin = create_clockin(
        db,
        user_id=user_id,
        project_id=project_id,
        latitude=latitude,
        longitude=longitude,
        postal_code=postal_code,
        photo_path=f"/uploads/clockins/{fname}"
    )
    return clockin

@router.post("/task-metadata")
async def save_task_metadata(
    task_id: str,
    project_id: str = None,
    latitude: float = None,
    longitude: float = None,
    postal_code: str = None
):
    redis_client.hset(
        f"task:{task_id}:extra",
        mapping={
            "project_id": str(project_id) if project_id else "",
            "latitude": str(latitude) if latitude else "",
            "longitude": str(longitude) if longitude else "",
            "postal_code": str(postal_code) if postal_code else ""
        }
    )
    return {"status": "metadata_saved"}

@router.get("/task-status/{task_id}")
async def get_task_status(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    Este endpoint permanece para cuando quieras volver a Celery.
    Por ahora sólo devuelve 'pending' hasta completarlo manualmente.
    """
    result = AsyncResult(task_id, app=celery_app)
    if not result.ready():
        return {"status": "pending"}

    # Si completó, devolvemos directamente el clockin ya creado
    if result.successful():
        return {"status": "completed", "clockin": result.result.get("clockin")}

    # Si falló:
    return {"status": "failed", "error": str(result.result.get("error", "Unknown"))}
