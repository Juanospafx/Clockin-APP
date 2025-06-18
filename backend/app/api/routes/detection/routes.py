
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
    """Endpoint para usuarios office/admin"""
    if current_user.role == RoleEnum.field:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Los usuarios field deben usar detección")

    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(await file.read())

    clockin = create_clockin(
        db,
        user_id=user_id,
        photo_path=f"/uploads/clockins/{fname}"
    )
    return clockin

@router.post("/clockins/{user_id}/detect", status_code=status.HTTP_202_ACCEPTED)
async def detect_and_clockin(
    user_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Endpoint para usuarios field (envía a Celery)"""
    if current_user.role != RoleEnum.field:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo field users pueden usar detección")

    image_bytes = await file.read()
    task = run_detection.delay(image_bytes, user_id)
    redis_client.hset(
        f"task:{task.id}:meta",
        mapping={
            "user_id": user_id,
            "created_at": str(datetime.utcnow())
        }
    )
    return {"task_id": task.id}

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
    result = AsyncResult(task_id, app=celery_app)
    if not result.ready():
        return {"status": "pending"}

    meta = redis_client.hgetall(f"task:{task_id}:meta")
    extra = redis_client.hgetall(f"task:{task_id}:extra")

    if not result.successful():
        error = str(result.result.get("error", "Unknown error"))
        return {"status": "failed", "error": error}

    detection_result = result.result

    # --- Si el modelo no aprueba, devolvemos failed inmediatamente ---
    if not detection_result.get("approved", False):
        # limpiamos metadatos
        redis_client.delete(f"task:{task_id}:meta")
        redis_client.delete(f"task:{task_id}:extra")
        return {
            "status": "failed",
            "error": "No cumples los requisitos de EPP; no puedes iniciar."
        }

    if detection_result.get("status") != "success":
        return {"status": "failed", "error": detection_result.get("error")}

    payload = {
        "user_id": meta.get(b"user_id").decode(),
        "project_id": extra.get(b"project_id").decode() if extra.get(b"project_id") else None,
        "latitude": float(extra.get(b"latitude").decode()) if extra.get(b"latitude") else None,
        "longitude": float(extra.get(b"longitude").decode()) if extra.get(b"longitude") else None,
        "postal_code": extra.get(b"postal_code").decode() if extra.get(b"postal_code") else None,
        **detection_result
    }

    clockin = start_clockin_detection(db, payload)
    # limpiamos
    redis_client.delete(f"task:{task_id}:meta")
    redis_client.delete(f"task:{task_id}:extra")

    return {"status": "completed", "clockin": clockin}
