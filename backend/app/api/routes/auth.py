# backend/app/api/routes/auth.py

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from typing import Generator, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import SessionLocal
from app.models import User

router = APIRouter()

# ---------------------------------------
# Constantes para JWT / BCrypt
# ---------------------------------------
SECRET_KEY = "f3d9a8f0b21d47d7f5c2b9c4b3d8a74387f28e64f2ce0b12991a8d390b3fbc1f"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Nota: el tokenUrl debe coincidir con tu ruta POST /login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ---------------------------------------
# Esquema de petición de login
# ---------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


# ---------------------------------------
# Dependencia para obtener la sesión de DB
# ---------------------------------------
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------
# Ruta POST /login
# ---------------------------------------
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Valida credenciales. Si correcta, genera un JWT con user_id y role.
    """
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "user_id": str(user.id),
        "role": user.role.value,
        "exp": expire
    }

    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "role": user.role.value,
        "expires_at": expire.isoformat()
    }


# ---------------------------------------
# Dependencia get_current_user
# ---------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Decodifica el JWT, extrae user_id y retorna el objeto User.
    Lanza 401 si el token es inválido o el usuario no existe.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


# ---------------------------------------
# Dependencia get_current_user_optional
# ---------------------------------------
def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Decodifica el JWT, extrae user_id y retorna el objeto User.
    Retorna None si el token es inválido o no está presente.
    """
    if token is None:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            return None
    except JWTError:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    return user
