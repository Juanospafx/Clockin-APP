from fastapi import APIRouter

router = APIRouter()

@router.get("/task-status/dummy")
async def dummy_status():
    return {"status": "dummy route"}
