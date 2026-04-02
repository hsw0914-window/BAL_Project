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
    category: Optional[str] = None   # None이면 AI 자동 분류
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


# 리포트용
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
