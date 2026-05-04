from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MaskedInfoCreate(BaseModel):
    info_type: str
    original_value: str
    masked_value: str


class MaskedInfoResponse(BaseModel):
    id: int
    info_type: str
    original_value: str
    masked_value: str

    model_config = {"from_attributes": True}


class RecordCreate(BaseModel):
    baby_id: int
    category: Optional[str] = None
    original_text: Optional[str] = None
    masked_text: Optional[str] = None
    image_path: Optional[str] = None
    record_date: datetime
    masked_info: List[MaskedInfoCreate] = []


class RecordUpdate(BaseModel):
    category: Optional[str] = None
    original_text: Optional[str] = None
    masked_text: Optional[str] = None
    image_path: Optional[str] = None
    record_date: Optional[datetime] = None


class RecordResponse(BaseModel):
    id: int
    user_id: int
    baby_id: int
    category: str
    original_text: Optional[str]
    masked_text: Optional[str]
    image_path: Optional[str]
    record_date: datetime
    created_at: datetime
    updated_at: datetime
    masked_info: List[MaskedInfoResponse] = []

    model_config = {"from_attributes": True}


# ── 기존 리포트 ───────────────────────────────────────────────

class CategorySummary(BaseModel):
    category: str
    count: int


class ReportResponse(BaseModel):
    baby_id: int
    start_date: datetime
    end_date: datetime
    total_count: int
    by_category: List[CategorySummary]
    records: List[RecordResponse]


# ── 수유량 리포트 ─────────────────────────────────────────────

class FeedingDailyItem(BaseModel):
    date: str            # "2025-05-01"
    formula_ml: int      # 분유 총량 (ml)
    formula_count: int   # 분유 수유 횟수
    breast_min: int      # 모유 수유 총 시간 (분)
    breast_count: int    # 모유 수유 횟수


class FeedingReportResponse(BaseModel):
    baby_id: int
    start_date: datetime
    end_date: datetime
    avg_daily_formula_ml: float   # 일 평균 분유량 (ml)
    avg_daily_breast_min: float   # 일 평균 모유 수유 시간 (분)
    avg_breast_per_day: float     # 일 평균 모유 수유 횟수
    total_feeds: int              # 총 수유 횟수
    daily: List[FeedingDailyItem]


# ── 수면 패턴 리포트 ──────────────────────────────────────────

class SleepDailyItem(BaseModel):
    date: str       # "2025-05-01"
    night_min: int  # 야간 수면 (분)
    nap_min: int    # 낮잠 (분)
    nap_count: int  # 낮잠 횟수


class SleepReportResponse(BaseModel):
    baby_id: int
    start_date: datetime
    end_date: datetime
    avg_total_hours: float   # 일 평균 총 수면 (시간)
    avg_night_hours: float   # 일 평균 야간 수면 (시간)
    avg_nap_hours: float     # 일 평균 낮잠 (시간)
    avg_nap_count: float     # 일 평균 낮잠 횟수
    daily: List[SleepDailyItem]


# ── 성장 곡선 리포트 ──────────────────────────────────────────

class GrowthItem(BaseModel):
    date: str                    # "2025-05-01"
    weight_kg: Optional[float]
    height_cm: Optional[float]
    head_cm: Optional[float]


class GrowthReportResponse(BaseModel):
    baby_id: int
    latest_weight_kg: Optional[float]
    latest_height_cm: Optional[float]
    latest_head_cm: Optional[float]
    items: List[GrowthItem]
