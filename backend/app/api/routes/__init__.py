# backend/app/api/routes/__init__.py

from fastapi import APIRouter
from .auth       import router as auth_router
from .users      import router as users_router
from .projects   import router as projects_router
from .clockins   import router as clockins_router
from .summary    import router as summary_router
from .detection.routes import router as detection_router
from app.api.routes.admin.users import router as admin_router
from .locations import router as locations_router

router = APIRouter()
router.include_router(auth_router)            # /login, /users/me, etc
router.include_router(projects_router)        # /projects
router.include_router(clockins_router)        # /clockins
router.include_router(summary_router)         # /summary
router.include_router(detection_router, prefix="/detection")  # /detection/…
router.include_router(admin_router)
router.include_router(locations_router)
router.include_router(users_router)
