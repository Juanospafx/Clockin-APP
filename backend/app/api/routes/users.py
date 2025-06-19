# backend/app/api/routes/users.py

import os
import uuid
from uuid import UUID
from datetime import datetime
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    File,
    UploadFile,
    Body,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import User as UserModel
from app.api.routes.auth import get_current_user

# — password hashing setup —
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# — where we store profile photos —
UPLOAD_ROOT = "uploads"
PROFILE_DIR = os.path.join(UPLOAD_ROOT, "profile_photos")

router = APIRouter(prefix="/users", tags=["users"])


# — Pydantic models —

class UserOut(BaseModel):
    id: UUID
    username: str
    email: str
    role: str
    created_at: datetime
    profile_photo: Optional[str] = None

    class Config:
        orm_mode = True


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# — endpoints —


@router.get("/me", response_model=UserOut)
async def get_my_user(
    current_user: UserModel = Depends(get_current_user),
):
    return current_user


@router.put(
    "/me",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Update own profile (username, email + optional photo)"
)
async def update_my_user(
    username: Optional[str] = Body(None),
    email: Optional[str] = Body(None),
    profile_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.get(UserModel, current_user.id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if username is not None:
        user.username = username
    if email is not None:
        user.email = email

    if profile_photo and profile_photo.filename:
        os.makedirs(PROFILE_DIR, exist_ok=True)
        if user.profile_photo:
            try:
                os.remove(os.path.join(PROFILE_DIR, user.profile_photo))
            except OSError:
                pass

        ext = profile_photo.filename.rsplit(".", 1)[-1]
        fn = f"{uuid.uuid4()}.{ext}"
        out_path = os.path.join(PROFILE_DIR, fn)
        contents = await profile_photo.read()
        with open(out_path, "wb") as f:
            f.write(contents)
        user.profile_photo = fn

    db.commit()
    db.refresh(user)
    return user


@router.put(
    "/me/password",
    status_code=status.HTTP_200_OK,
    summary="Change own password"
)
async def change_my_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user = db.get(UserModel, current_user.id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Aquí usamos `user.password` en lugar de `user.hashed_password`
    if not pwd_context.verify(data.old_password, user.password):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Current password is incorrect")

    # Y lo actualizamos también sobre `user.password`
    user.password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
