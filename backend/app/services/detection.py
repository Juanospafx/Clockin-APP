# app/services/detection.py

import os
from uuid import uuid4
from typing import Optional, Dict, Any

from celery.result import AsyncResult

from app.worker import celery_app, run_detection

# Directorio donde vamos a volcar las imágenes procesadas
UPLOAD_DIR = "uploads/clockins"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def enqueue_detection(
    file: Any,
    user_id: str,
    project_id: Optional[str],
    latitude: float,
    longitude: float,
    postal_code: Optional[str] = None,
) -> str:
    """
    Encola una tarea de detección EPP. 
    file puede ser un UploadFile de FastAPI o una ruta de fichero.
    Devuelve el task_id de Celery.
    """
    # 1) Leemos los bytes de la imagen
    if hasattr(file, "read"):
        # FastAPI UploadFile
        image_bytes = file.file.read()
    else:
        # ruta a fichero en disco
        with open(file, "rb") as f:
            image_bytes = f.read()

    # 2) Construimos un payload genérico
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "project_id": project_id,
        "latitude": latitude,
        "longitude": longitude,
        "postal_code": postal_code,
        "photo_bytes": image_bytes,
    }

    # 3) Disparamos la tarea en Celery
    task = run_detection.delay(payload)
    return task.id


def get_detection_status(task_id: str) -> Dict[str, Any]:
    """
    Consulta el estado de la tarea Celery. 
    Si está pendiente, devuelve {'status': 'pending'}.
    Si falló, {'status': 'failed'}.
    Si tuvo éxito, {'status': 'completed', 'payload': <resultado>}.
    """
    result = AsyncResult(task_id, app=celery_app)

    if not result.ready():
        return {"status": "pending"}

    if not result.successful():
        return {"status": "failed", "error": str(result.result)}

    # En result.result devolvemos exactamente el dict que retorna run_detection
    return {"status": "completed", "payload": result.result}
