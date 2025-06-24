import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Float,
    ForeignKey,
    Enum,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class RoleEnum(enum.Enum):
    admin  = "admin"
    office = "office"
    field  = "field"

class ProjectStatusEnum(enum.Enum):
    start       = "start"
    in_progress = "in_progress"
    finished    = "finished"

class User(Base):
    __tablename__ = "users"
    id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username      = Column(String(50), nullable=False, unique=True)
    email         = Column(String(120), unique=True)
    password      = Column(String(128), nullable=False)
    role          = Column(Enum(RoleEnum, name="userroleenum"), default=RoleEnum.field, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    profile_photo = Column(String(255), nullable=True)

class Project(Base):
    __tablename__ = "projects"
    id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    description   = Column(Text)
    state         = Column(String(100), nullable=True)
    city          = Column(String(100), nullable=True)
    street        = Column(String(200), nullable=True)
    street_number = Column(String(50), nullable=True)
    postal_code   = Column(String(20), nullable=True)
    location_lat  = Column(Float, nullable=True)
    location_long = Column(Float, nullable=True)
    status        = Column(Enum(ProjectStatusEnum, name="projectstatusenum"), nullable=False, default=ProjectStatusEnum.start)
    start_date    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date      = Column(DateTime(timezone=True), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

class Clockin(Base):
    __tablename__ = "clockins"
    id            = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id       = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    project_id    = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    start_time    = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_time      = Column(DateTime(timezone=True), nullable=True)
    status        = Column(String, nullable=False, default="in_progress")
    location_lat  = Column(Float, nullable=True)
    location_long = Column(Float, nullable=True)
    postal_code   = Column(String, nullable=True)
    photo_path    = Column(String, nullable=True)
    approved      = Column(Boolean, default=False, nullable=False)
    created_at    = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    detections    = relationship("Detection", back_populates="clockin")

class Detection(Base):
    __tablename__ = "detections"
    id         = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    clockin_id = Column(PG_UUID(as_uuid=True), ForeignKey("clockins.id", ondelete="CASCADE"), nullable=False)
    label      = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    clockin    = relationship("Clockin", back_populates="detections")

class ClockinHistory(Base):
    __tablename__ = "clockin_history"
    id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clockin_id    = Column(PG_UUID(as_uuid=True), ForeignKey("clockins.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(PG_UUID(as_uuid=True), ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    project_id    = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    state         = Column(String(100), nullable=False)
    city          = Column(String(100), nullable=False)
    street        = Column(String(200), nullable=False)
    street_number = Column(String(50), nullable=False)
    postal_code   = Column(String(20), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user    = relationship("User",    lazy="joined")
    project = relationship("Project", lazy="joined")
    clockin = relationship("Clockin", lazy="joined")

class ProjectHistory(Base):
    __tablename__ = "project_history"
    id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id    = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(PG_UUID(as_uuid=True), ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    clockin_id    = Column(PG_UUID(as_uuid=True), ForeignKey("clockins.id",ondelete="CASCADE"), nullable=True)
    date          = Column(DateTime(timezone=True), nullable=False)

    # ← Snapshot fields
    status        = Column(Enum(ProjectStatusEnum), nullable=False)
    start_date    = Column(DateTime(timezone=True), nullable=True)
    end_date      = Column(DateTime(timezone=True), nullable=True)
    state         = Column(String(100), nullable=True)
    city          = Column(String(100), nullable=True)
    street        = Column(String(200), nullable=True)
    street_number = Column(String(50),  nullable=True)
    postal_code   = Column(String(20),  nullable=True)

    project = relationship("Project", lazy="joined")
    user    = relationship("User",    lazy="joined")
    clockin = relationship("Clockin", lazy="joined")


class UserLocation(Base):
    __tablename__ = "user_locations"
    id         = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clockin_id = Column(PG_UUID(as_uuid=True), ForeignKey("clockins.id"), nullable=True)
    latitude   = Column(Float, nullable=False)
    longitude  = Column(Float, nullable=False)
    timestamp  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user    = relationship("User")
    clockin = relationship("Clockin")
