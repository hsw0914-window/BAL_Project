from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel


class BabyCreate(BaseModel):
    name: str
    birth_date: date
    gender: Literal["male", "female", "unknown"] = "unknown"


class BabyUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[Literal["male", "female", "unknown"]] = None


class BabyResponse(BaseModel):
    id: int
    user_id: int
    name: str
    birth_date: date
    gender: str
    created_at: datetime

    model_config = {"from_attributes": True}
