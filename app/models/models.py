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

    babies    = relationship("Baby",     back_populates="user", cascade="all, delete-orphan")
    records   = relationship("Record",   back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")


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


# ── OCR 문서 ──────────────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    user_id           = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type     = Column(Enum("prescription", "vaccination", "medical_certificate"), nullable=False)
    masked_image_url  = Column(String(500))
    masked_text       = Column(Text)
    created_at        = Column(DateTime, nullable=False, server_default=func.now())
    updated_at        = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    user                       = relationship("User", back_populates="documents")
    prescription_detail        = relationship("PrescriptionDetail",       back_populates="document", uselist=False, cascade="all, delete-orphan")
    vaccination_detail         = relationship("VaccinationDetail",        back_populates="document", uselist=False, cascade="all, delete-orphan")
    medical_certificate_detail = relationship("MedicalCertificateDetail", back_populates="document", uselist=False, cascade="all, delete-orphan")


class PrescriptionDetail(Base):
    __tablename__ = "prescription_details"

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    document_id           = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    hospital_name         = Column(String(100))
    prescription_date     = Column(Date)
    dispense_date         = Column(Date)
    department            = Column(String(50))
    notes                 = Column(Text)
    created_at            = Column(DateTime, nullable=False, server_default=func.now())

    document  = relationship("Document",              back_populates="prescription_detail")
    medicines = relationship("PrescriptionMedicine",  back_populates="prescription_detail", cascade="all, delete-orphan")


class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    id                     = Column(Integer, primary_key=True, autoincrement=True)
    prescription_detail_id = Column(Integer, ForeignKey("prescription_details.id", ondelete="CASCADE"), nullable=False)
    medicine_name          = Column(String(100), nullable=False)
    dose                   = Column(String(50))    # 1회 복용량
    frequency              = Column(String(50))    # 1일 복용 횟수
    duration               = Column(String(50))    # 총 복용 기간
    method                 = Column(String(100))   # 복용 방법
    created_at             = Column(DateTime, nullable=False, server_default=func.now())

    prescription_detail = relationship("PrescriptionDetail", back_populates="medicines")


class VaccinationDetail(Base):
    __tablename__ = "vaccination_details"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    document_id      = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    institution_name = Column(String(100))
    vaccination_date = Column(Date)
    vaccine_name     = Column(String(100))
    dose_number      = Column(Integer)             # 접종 차수
    manufacturer     = Column(String(100))         # 제조사 또는 백신 상세
    notes            = Column(Text)
    created_at       = Column(DateTime, nullable=False, server_default=func.now())

    document = relationship("Document", back_populates="vaccination_detail")


class MedicalCertificateDetail(Base):
    __tablename__ = "medical_certificate_details"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    document_id   = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    hospital_name = Column(String(100))
    visit_date    = Column(Date)
    department    = Column(String(50))
    purpose       = Column(String(200))   # 제출용도 / 발급 목적
    notes         = Column(Text)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())

    document = relationship("Document", back_populates="medical_certificate_detail")
