from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import (
    Document, PrescriptionDetail, PrescriptionMedicine,
    VaccinationDetail, MedicalCertificateDetail,
)
from app.schemas.document import (
    DocumentCreate, DocumentResponse, DocumentUpdate,
    DocumentType,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


def _load_document(document_id: int, user_id: int, db: Session) -> Document:
    doc = (
        db.query(Document)
        .options(
            joinedload(Document.prescription_detail).joinedload(PrescriptionDetail.medicines),
            joinedload(Document.vaccination_detail),
            joinedload(Document.medical_certificate_detail),
        )
        .filter(Document.id == document_id, Document.user_id == user_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return doc


@router.post("", response_model=DocumentResponse, status_code=201)
def create_document(
    body: DocumentCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """OCR 문서 저장 (처방전 / 예방접종 / 진료확인서)"""
    doc = Document(
        user_id=user_id,
        document_type=body.document_type,
        masked_image_url=body.masked_image_url,
        masked_text=body.masked_text,
    )
    db.add(doc)
    db.flush()  # doc.id 확보

    if body.document_type == "prescription":
        detail_data = body.prescription_detail or {}
        medicines = []
        if hasattr(detail_data, "medicines"):
            medicines = detail_data.medicines
            detail_dict = detail_data.model_dump(exclude={"medicines"})
        else:
            detail_dict = {}

        detail = PrescriptionDetail(document_id=doc.id, **detail_dict)
        db.add(detail)
        db.flush()

        for med in medicines:
            db.add(PrescriptionMedicine(
                prescription_detail_id=detail.id,
                **med.model_dump(),
            ))

    elif body.document_type == "vaccination":
        detail_data = body.vaccination_detail or {}
        detail_dict = detail_data.model_dump() if hasattr(detail_data, "model_dump") else {}
        db.add(VaccinationDetail(document_id=doc.id, **detail_dict))

    elif body.document_type == "medical_certificate":
        detail_data = body.medical_certificate_detail or {}
        detail_dict = detail_data.model_dump() if hasattr(detail_data, "model_dump") else {}
        db.add(MedicalCertificateDetail(document_id=doc.id, **detail_dict))

    db.commit()
    return _load_document(doc.id, user_id, db)


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    document_type: Optional[DocumentType] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """내 문서 목록 조회"""
    q = (
        db.query(Document)
        .options(
            joinedload(Document.prescription_detail).joinedload(PrescriptionDetail.medicines),
            joinedload(Document.vaccination_detail),
            joinedload(Document.medical_certificate_detail),
        )
        .filter(Document.user_id == user_id)
    )
    if document_type:
        q = q.filter(Document.document_type == document_type)

    return q.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """문서 상세 조회"""
    return _load_document(document_id, user_id, db)


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    body: DocumentUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """문서 기본 정보 수정 (마스킹 이미지·텍스트)"""
    doc = _load_document(document_id, user_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(doc, field, value)
    db.commit()
    db.refresh(doc)
    return _load_document(document_id, user_id, db)


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """문서 삭제 (상세 정보 연쇄 삭제)"""
    doc = _load_document(document_id, user_id, db)
    db.delete(doc)
    db.commit()
