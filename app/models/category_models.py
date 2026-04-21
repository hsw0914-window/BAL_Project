from sqlalchemy import (
    Column, Integer, String, Text, Float,
    Enum, ForeignKey, func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# ------------------------------------------------
# 모유 수유 기록
# records 테이블의 id를 참조
# ------------------------------------------------
class BreastfeedingRecord(Base):
    __tablename__ = "breastfeeding_records"

    id           = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id    = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    duration_min = Column(Integer)   # 수유 시간 (분 단위, 예: 15)
    summary      = Column(Text)      # AI 요약 소제목 (예: "새벽 2시 모유 수유 15분")

    record = relationship("Record", back_populates="breastfeeding")


# ------------------------------------------------
# 분유 수유 기록
# ------------------------------------------------
class FormulaRecord(Base):
    __tablename__ = "formula_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    amount_ml = Column(Integer)  # 수유량 (ml 단위, 예: 180)
    summary   = Column(Text)     # AI 요약 소제목

    record = relationship("Record", back_populates="formula")


# ------------------------------------------------
# 이유식 기록
# ------------------------------------------------
class BabyFoodRecord(Base):
    __tablename__ = "baby_food_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    food_name = Column(String(255))  # 음식명 (예: 감자죽, 당근 퓨레)
    amount_g  = Column(Integer)      # 섭취량 (g 단위, 모를 경우 NULL)
    reaction  = Column(Text)         # 아기 반응 (예: 잘 먹음, 뱉음, 알레르기 의심)
    summary   = Column(Text)         # AI 요약 소제목

    record = relationship("Record", back_populates="baby_food")


# ------------------------------------------------
# 기저귀 기록
# ------------------------------------------------
class DiaperRecord(Base):
    __tablename__ = "diaper_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    type      = Column(Enum("소변", "대변", "소변+대변"))  # 기저귀 종류
    summary   = Column(Text)                               # AI 요약 소제목

    record = relationship("Record", back_populates="diaper")


# ------------------------------------------------
# 수면 기록
# ------------------------------------------------
class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id           = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id    = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    sleep_type   = Column(Enum("낮잠", "야간수면"))  # 수면 종류
    duration_min = Column(Integer)                   # 수면 시간 (분 단위, 모를 경우 NULL)
    summary      = Column(Text)                      # AI 요약 소제목

    record = relationship("Record", back_populates="sleep")


# ------------------------------------------------
# 성장 기록
# ------------------------------------------------
class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    height_cm = Column(Float)  # 키 (cm 단위, 미측정 시 NULL)
    weight_kg = Column(Float)  # 몸무게 (kg 단위, 미측정 시 NULL)
    head_cm   = Column(Float)  # 두위 (cm 단위, 미측정 시 NULL)
    summary   = Column(Text)   # AI 요약 소제목

    record = relationship("Record", back_populates="growth")


# ------------------------------------------------
# 발달 기록
# ------------------------------------------------
class DevelopmentRecord(Base):
    __tablename__ = "development_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    milestone = Column(Text)  # 발달 이정표 (예: 뒤집기 성공, 첫 걸음마, 엄마 첫 발화)
    summary   = Column(Text)  # AI 요약 소제목

    record = relationship("Record", back_populates="development")


# ------------------------------------------------
# 건강 기록
# ------------------------------------------------
class HealthRecord(Base):
    __tablename__ = "health_records"

    id          = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id   = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    temperature = Column(Float)  # 체온 (℃ 단위, 미측정 시 NULL)
    medicine    = Column(Text)   # 복용 약 이름 및 용량 (예: 타이레놀 시럽 5ml)
    symptom     = Column(Text)   # 증상 설명 (예: 콧물, 기침, 발열)
    summary     = Column(Text)   # AI 요약 소제목

    record = relationship("Record", back_populates="health")


# ------------------------------------------------
# 병원 방문 기록
# ------------------------------------------------
class HospitalRecord(Base):
    __tablename__ = "hospital_records"

    id            = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id     = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    hospital_name = Column(String(255))  # 병원 이름 (모를 경우 NULL)
    purpose       = Column(Text)         # 방문 목적 (예: 발열 진료, 독감 예방접종)
    prescription  = Column(Text)         # 처방 내용 (없으면 NULL)
    summary       = Column(Text)         # AI 요약 소제목

    record = relationship("Record", back_populates="hospital")


# ------------------------------------------------
# 일상 기록
# 위 카테고리에 해당하지 않는 자유 메모
# AI 분류 불가 시 기본값으로도 사용
# ------------------------------------------------
class DailyRecord(Base):
    __tablename__ = "daily_records"

    id        = Column(Integer, primary_key=True, autoincrement=True)  # 고유 ID
    record_id = Column(Integer, ForeignKey("records.id", ondelete="CASCADE"), nullable=False)  # 부모 기록 ID
    memo      = Column(Text)  # 자유 형식 메모 (예: 오늘 처음으로 까꿍 놀이에 반응함)
    summary   = Column(Text)  # AI 요약 소제목

    record = relationship("Record", back_populates="daily")
