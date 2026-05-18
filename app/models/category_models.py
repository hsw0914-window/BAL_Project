from sqlalchemy import (
    Column, Integer, String, Text, Float,
    Enum, ForeignKey, func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class BreastfeedingRecord(Base):
    __tablename__ = "breastfeeding_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    # duration_min 삭제 → Record.duration_minutes (ended_at - started_at) 로 계산
    summary   = Column(Text)   # AI 요약 소제목

    record = relationship("Record", back_populates="breastfeeding")


class FormulaRecord(Base):
    __tablename__ = "formula_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    amount_ml = Column(Integer)  # 수유량 (ml)
    summary   = Column(Text)

    record = relationship("Record", back_populates="formula")


class BabyFoodRecord(Base):
    __tablename__ = "baby_food_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    food_name = Column(String(255))
    amount_g  = Column(Integer)
    reaction  = Column(Text)
    summary   = Column(Text)

    record = relationship("Record", back_populates="baby_food")


class DiaperRecord(Base):
    __tablename__ = "diaper_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    type      = Column(Enum("소변", "대변", "소변+대변"))
    summary   = Column(Text)

    record = relationship("Record", back_populates="diaper")


class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    record_id  = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    sleep_type = Column(Enum("낮잠", "야간수면"))
    # duration_min 삭제 → Record.duration_minutes (ended_at - started_at) 로 계산
    summary    = Column(Text)

    record = relationship("Record", back_populates="sleep")


class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    head_cm   = Column(Float)
    summary   = Column(Text)

    record = relationship("Record", back_populates="growth")


class DevelopmentRecord(Base):
    __tablename__ = "development_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    milestone = Column(Text)
    summary   = Column(Text)

    record = relationship("Record", back_populates="development")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    record_id   = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    temperature = Column(Float)
    medicine    = Column(Text)
    symptom     = Column(Text)
    summary     = Column(Text)

    record = relationship("Record", back_populates="health")


class HospitalRecord(Base):
    __tablename__ = "hospital_records"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    record_id     = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    hospital_name = Column(String(255))
    purpose       = Column(Text)
    prescription  = Column(Text)
    summary       = Column(Text)

    record = relationship("Record", back_populates="hospital")


class DailyRecord(Base):
    __tablename__ = "daily_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    memo      = Column(Text)
    summary   = Column(Text)

    record = relationship("Record", back_populates="daily")
