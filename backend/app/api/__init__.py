from fastapi import APIRouter
from .detect import router as detect_router
from .clockin import router as clockin_router  # si aquí está task-status



router = APIRouter()
router.include_router(detect_router)
router.include_router(clockin_router)
