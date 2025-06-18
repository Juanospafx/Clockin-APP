# backend/app/worker.py

from celery import Celery
import torch
from PIL import Image
import io
import os
from uuid import uuid4

# Configuración de Celery
celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

# Carpeta donde volcar las imágenes de clockin
UPLOAD_DIR = "uploads/clockins"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Carga el modelo YOLOv5 (tu peso custom)
model = torch.hub.load(
    "ultralytics/yolov5",
    "custom",
    path="yolov5/epp-detector/exp8/weights/best.pt",
    force_reload=False,
)

def save_uploaded_image(image_bytes: bytes) -> str:
    """Guarda la imagen y devuelve la ruta relativa."""
    fname = f"{uuid4()}.jpg"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(image_bytes)
    return f"/uploads/clockins/{fname}"

@celery_app.task(bind=True, name="app.worker.run_detection")
def run_detection(self, image_bytes: bytes, user_id: str):
    try:
        # --- 1) Prepara la imagen ---
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # --- 2) Inferencia con threshold más bajo ---
        results = model(img, conf=0.3, iou=0.45)
        labels = results.pandas().xyxy[0].to_dict(orient="records")

        # --- 3) Normaliza nombres de clase ---
        found = {
            d["name"].lower().replace(" ", "_")
            for d in labels
        }

        # --- 4) Nueva lógica de aprobación ---
        # Si aparece alguna clase que empieza por "not_", rechazamos.
        has_negative = any(name.startswith("not_") for name in found)
        approved = not has_negative

        # --- 5) Log interno para depurar ---
        print(f"[detect] user={user_id} found={found} approved={approved}")

        # --- 6) Guarda la foto y devuelve la ruta ---
        photo_path = save_uploaded_image(image_bytes)

        return {
            "status":     "success",
            "detection":  labels,
            "approved":   approved,
            "photo_path": photo_path
        }

    except Exception as e:
        return {
            "status": "failed",
            "error":  str(e)
        }
