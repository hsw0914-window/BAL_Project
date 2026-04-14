from pydantic import BaseModel
from typing import List, Dict, Any


class DetectedItem(BaseModel):
    type: str
    original: str


class MedicineItem(BaseModel):
    name: str
    dose: str
    frequency: str
    duration: str
    method: str = ""


class ProcessResponse(BaseModel):
    status: str
    document_type: str
    masked_text: str
    detected: List[DetectedItem]
    medicines: List[MedicineItem]
    notes: List[str]
    extracted: Dict[str, Any]
    masked_image_url: str
    message: str = ""
