# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

import os
from dotenv import load_dotenv

load_dotenv()
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.database import engine, SessionLocal
from app import models

# Routers
from app.api.routes import router as api_router
from app.api.routes.clockins import router as clockins_router
from app.api.routes.clockin_history import router as history_router
from app.api.routes.project_history import router as project_history_router
from app.api.routes.summary import router as summary_router
from app.api.routes.projects import router as projects_router
from app.api.routes.detection.routes import router as detection_router
from app.api.routes.users import router as users_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# ———————————————————————
# Configuración CORS MEJORADA
# ———————————————————————
# Obtener entorno (producción o desarrollo)
environment = os.getenv("ENVIRONMENT", "production")

# Permitir cualquier origen en producción
if environment == "production":
    origins = [
        "https://clockinapp.lat",
    ]
else:
    # Para desarrollo permite localhost también
    frontend_origins = os.getenv("FRONTEND_ORIGINS")
    if frontend_origins:
        origins = [o.strip() for o in frontend_origins.split(",") if o.strip()]
    else:
        origins = [
            "https://localhost:5173",
            "https://127.0.0.1:5173",
            "https://localhost:3000",
            "https://127.0.0.1:3000",
        ]

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add TrustedHostMiddleware to allow specific hosts
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Add ProxyHeadersMiddleware to handle X-Forwarded-Proto




# ———————————————————————
# Inicializar BD y servir estáticos
# ———————————————————————
models.Base.metadata.create_all(bind=engine)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ———————————————————————
# Routers
# ———————————————————————
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

app.include_router(api_router, prefix="/api")
app.include_router(clockins_router)
app.include_router(history_router)
app.include_router(project_history_router)
app.include_router(summary_router)
app.include_router(projects_router)
app.include_router(detection_router)


# ———————————————————————
# Scheduler para promover proyectos
# ———————————————————————
def promote_projects_start_to_in_progress():
    db: Session = SessionLocal()
    try:
        from app.models import Project as ProjectModel, ProjectStatusEnum
        threshold = datetime.utcnow() - timedelta(days=1)
        proyectos = (
            db.query(ProjectModel)
            .filter(
                ProjectModel.status == ProjectStatusEnum.start,
                ProjectModel.created_at <= threshold
            )
            .all()
        )
        for proyecto in proyectos:
            proyecto.status = ProjectStatusEnum.in_progress
            logger.info("Promovido %s a in_progress", proyecto.id)
        db.commit()
    except Exception:
        logger.exception("Error en promote_projects_start_to_in_progress")
        db.rollback()
    finally:
        db.close()

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(
        promote_projects_start_to_in_progress,
        trigger=CronTrigger(hour="0", minute="0"),
        id="promote_projects_job",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler iniciado")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown(wait=False)
    logger.info("Scheduler detenido")