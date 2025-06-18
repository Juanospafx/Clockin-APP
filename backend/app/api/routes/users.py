# 1. app/api/routes/users.py (Public user operations)
import os
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User as UserModel
from app.models import RoleEnum
from app.api.routes.auth import get_current_user

# Where we store profile photos
UPLOAD_ROOT = "uploads"
PROFILE_DIR = os.path.join(UPLOAD_ROOT, "profile_photos")

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_my_user(
    current_user: UserModel = Depends(get_current_user)
):
    return current_user

@router.put(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Update own profile (username, email + optional photo)"
)
async def update_my_user(
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    profile_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.query(UserModel).get(current_user.id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if username:
        user.username = username
    if email:
        user.email = email

    if profile_photo and profile_photo.filename:
        os.makedirs(PROFILE_DIR, exist_ok=True)
        if user.profile_photo:
            try:
                os.remove(os.path.join(PROFILE_DIR, user.profile_photo))
            except OSError:
                pass
        ext = profile_photo.filename.rsplit(".", 1)[-1]
        fn = f"{uuid4()}.{ext}"
        out = os.path.join(PROFILE_DIR, fn)
        contents = await profile_photo.read()
        with open(out, "wb") as f:
            f.write(contents)
        user.profile_photo = fn

    db.commit()
    db.refresh(user)
    return user
