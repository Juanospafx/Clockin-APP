import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import User as UserModel, RoleEnum
from app.api.routes.auth import get_current_user

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
UPLOAD_ROOT = "uploads"
PROFILE_DIR = os.path.join(UPLOAD_ROOT, "profile_photos")

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


# — Schemas para JSON —
class UserCreateSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleEnum


class UserUpdateSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[RoleEnum] = None


# — Listar usuarios —
@router.get("/", status_code=status.HTTP_200_OK)
def list_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    return db.query(UserModel).all()


# — Crear usuario (JSON) —
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    if db.query(UserModel).filter_by(username=payload.username).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username already exists")
    hashed = pwd_context.hash(payload.password)
    user = UserModel(
        id=uuid.uuid4(),
        username=payload.username,
        email=payload.email,
        password=hashed,
        role=payload.role,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# — Actualizar usuario (JSON) —
@router.put("/{user_id}", status_code=status.HTTP_200_OK)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    user = db.query(UserModel).get(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if payload.username is not None:
        user.username = payload.username
    if payload.email is not None:
        user.email = payload.email
    if payload.role is not None:
        user.role = payload.role
    if payload.password is not None:
        user.password = pwd_context.hash(payload.password)

    db.commit()
    db.refresh(user)
    return user


# — Borrar usuario —
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
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
