# 2. app/api/routes/admin/users.py (Admin-only operations)
import os
from uuid import uuid4, UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import Optional
from passlib.context import CryptContext

from app.database import get_db
from app.models import User as UserModel, RoleEnum
from app.api.routes.auth import get_current_user

# for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# profile photo directory
UPLOAD_ROOT = "uploads"
PROFILE_DIR = os.path.join(UPLOAD_ROOT, "profile_photos")

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

@router.get("/", status_code=status.HTTP_200_OK)
def list_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    return db.query(UserModel).all()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: RoleEnum = Form(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    if db.query(UserModel).filter_by(username=username).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username already exists")
    hashed = pwd_context.hash(password)
    user = UserModel(
        id=uuid4(),
        username=username,
        email=email,
        password=hashed,
        role=role,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", status_code=status.HTTP_200_OK)
def update_user(
    user_id: UUID,
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    role: Optional[RoleEnum] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    user = db.query(UserModel).get(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if username is not None:
        user.username = username
    if email is not None:
        user.email = email
    if role is not None:
        user.role = role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    user = db.query(UserModel).get(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.profile_photo:
        try:
            os.remove(os.path.join(PROFILE_DIR, user.profile_photo))
        except OSError:
            pass
    db.delete(user)
    db.commit()
