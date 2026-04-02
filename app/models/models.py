from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date,
    Enum, ForeignKey, func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    username      = Column(String(50), unique=True, nullable=False)   # 로그인용 아이디
    name          = Column(String(50), nullable=False)                # 실명
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nickname      = Column(String(50), nullable=False)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())

    babies  = relationship("Baby",   back_populates="user", cascade="all, delete-orphan")
    records = relationship("Record", back_populates="user", cascade="all, delete-orphan")


class Baby(Base):
    __tablename__ = "babies"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name       = Column(String(50), nullable=False)
    birth_date = Column(Date, nullable=False)
    gender     = Column(Enum("male", "female", "unknown"), nullable=False, default="unknown")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    user    = relationship("User",   back_populates="babies")
    records = relationship("Record", back_populates="baby", cascade="all, delete-orphan")


class Record(Base):
    __tablename__ = "records"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    baby_id       = Column(Integer, ForeignKey("babies.id", ondelete="CASCADE"), nullable=False)
    category      = Column(String(50), nullable=False)
    original_text = Column(Text)
    masked_text   = Column(Text)
    image_path    = Column(String(500))
    record_date   = Column(DateTime, nullable=False)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())
    updated_at    = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    user        = relationship("User", back_populates="records")
    baby        = relationship("Baby", back_populates="records")
    masked_info = relationship("MaskedInfo", back_populates="record", cascade="all, delete-orphan")


class MaskedInfo(Base):
    __tablename__ = "masked_info"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    record_id      = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    info_type      = Column(String(50), nullable=False)
    original_value = Column(String(500), nullable=False)
    masked_value   = Column(String(500), nullable=False)

    record = relationship("Record", back_populates="masked_info")