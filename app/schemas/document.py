from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel


# ── 약 정보 ──────────────────────────────────────────────────

class PrescriptionMedicineCreate(BaseModel):
    medicine_name: str
    dose:          Optional[str] = None
    frequency:     Optional[str] = None
    duration:      Optional[str] = None
    method:        Optional[str] = None


class PrescriptionMedicineResponse(BaseModel):
    id:            int
    medicine_name: str
    dose:          Optional[str]
    frequency:     Optional[str]
    duration:      Optional[str]
    method:        Optional[str]
    created_at:    datetime

    model_config = {"from_attributes": True}


# ── 처방전 상세 ───────────────────────────────────────────────

class PrescriptionDetailCreate(BaseModel):
    hospital_name:     Optional[str]  = None
    prescription_date: Optional[date] = None
    dispense_date:     Optional[date] = None
    department:        Optional[str]  = None
    notes:             Optional[str]  = None
    medicines:         List[PrescriptionMedicineCreate] = []


class PrescriptionDetailResponse(BaseModel):
    id:                int
    document_id:       int
    hospital_name:     Optional[str]
    prescription_date: Optional[date]
    dispense_date:     Optional[date]
    department:        Optional[str]
    notes:             Optional[str]
    created_at:        datetime
    medicines:         List[PrescriptionMedicineResponse] = []

    model_config = {"from_attributes": True}


# ── 예방접종 상세 ─────────────────────────────────────────────

class VaccinationDetailCreate(BaseModel):
    institution_name: Optional[str]  = None
    vaccination_date: Optional[date] = None
    vaccine_name:     Optional[str]  = None
    dose_number:      Optional[int]  = None
    manufacturer:     Optional[str]  = None
    notes:            Optional[str]  = None


class VaccinationDetailResponse(BaseModel):
    id:               int
    document_id:      int
    institution_name: Optional[str]
    vaccination_date: Optional[date]
    vaccine_name:     Optional[str]
    dose_number:      Optional[int]
    manufacturer:     Optional[str]
    notes:            Optional[str]
    created_at:       datetime

    model_config = {"from_attributes": True}


# ── 진료확인서 상세 ───────────────────────────────────────────

class MedicalCertificateDetailCreate(BaseModel):
    hospital_name: Optional[str]  = None
    visit_date:    Optional[date] = None
    department:    Optional[str]  = None
    purpose:       Optional[str]  = None
    notes:         Optional[str]  = None


class MedicalCertificateDetailResponse(BaseModel):
    id:            int
    document_id:   int
    hospital_name: Optional[str]
    visit_date:    Optional[date]
    department:    Optional[str]
    purpose:       Optional[str]
    notes:         Optional[str]
    created_at:    datetime

    model_config = {"from_attributes": True}


# ── 문서 (공통) ───────────────────────────────────────────────

DocumentType = Literal["prescription", "vaccination", "medical_certificate"]


class DocumentCreate(BaseModel):
    document_type:    DocumentType
    masked_image_url: Optional[str] = None
    masked_text:      Optional[str] = None

    # 문서 종류에 맞는 상세 정보 (하나만 입력)
    prescription_detail:        Optional[PrescriptionDetailCreate]        = None
    vaccination_detail:         Optional[VaccinationDetailCreate]         = None
    medical_certificate_detail: Optional[MedicalCertificateDetailCreate]  = None


class DocumentResponse(BaseModel):
    id:               int
    user_id:          int
    document_type:    str
    masked_image_url: Optional[str]
    masked_text:      Optional[str]
    created_at:       datetime
    updated_at:       datetime

    prescription_detail:        Optional[PrescriptionDetailResponse]        = None
    vaccination_detail:         Optional[VaccinationDetailResponse]         = None
    medical_certificate_detail: Optional[MedicalCertificateDetailResponse]  = None

    model_config = {"from_attributes": True}


class DocumentUpdate(BaseModel):
    masked_image_url: Optional[str] = None
    masked_text:      Optional[str] = None
