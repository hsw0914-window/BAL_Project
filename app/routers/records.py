import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Baby, Record, MaskedInfo
from app.schemas.record import RecordCreate, RecordUpdate, RecordResponse
from app.services.ai_service import process_record

settings = get_settings()
router = APIRouter(prefix="/records", tags=["Records"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


def _get_record_or_404(record_id: int, user_id: int, db: Session) -> Record:
    record = (
        db.query(Record)
        .options(joinedload(Record.masked_info))
        .filter(Record.id == record_id, Record.user_id == user_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return record


def _verify_baby_owner(baby_id: int, user_id: int, db: Session) -> None:
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")


# ── 기록 생성 (텍스트) ─────────────────────────────────────────
@router.post("", response_model=RecordResponse, status_code=201)
def create_record(
    body: RecordCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """육아 기록 저장 (AI 자동 분류 + 마스킹 포함)"""
    _verify_baby_owner(body.baby_id, user_id, db)

    # AI 분류 & 마스킹
    ai_result = process_record(body.original_text or "", body.category)

    record = Record(
        user_id=user_id,
        baby_id=body.baby_id,
        category=ai_result["category"],
        original_text=body.original_text,
        masked_text=ai_result["masked_text"],
        image_path=body.image_path,
        record_date=body.record_date,
    )
    db.add(record)
    db.flush()  # record.id 확보

    # 마스킹 정보 저장 (요청 body 우선, 없으면 AI 결과)
    items = body.masked_info if body.masked_info else ai_result["masked_info"]
    for item in items:
        mi = item if isinstance(item, dict) else item.model_dump()
        db.add(MaskedInfo(record_id=record.id, **mi))

    db.commit()
    db.refresh(record)
    return record


# ── 이미지 업로드 포함 기록 생성 ──────────────────────────────
@router.post("/with-image", response_model=RecordResponse, status_code=201)
async def create_record_with_image(
    baby_id: int = Form(...),
    category: Optional[str] = Form(None),
    original_text: Optional[str] = Form(None),
    record_date: datetime = Form(...),
    image: Optional[UploadFile] = File(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """이미지 첨부 기록 저장"""
    _verify_baby_owner(baby_id, user_id, db)

    image_path = None
    if image:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다.")
        content = await image.read()
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = image.filename.rsplit(".", 1)[-1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)
        image_path = file_path

    ai_result = process_record(original_text or "", category)

    record = Record(
        user_id=user_id,
        baby_id=baby_id,
        category=ai_result["category"],
        original_text=original_text,
        masked_text=ai_result["masked_text"],
        image_path=image_path,
        record_date=record_date,
    )
    db.add(record)
    db.flush()

    for item in ai_result["masked_info"]:
        db.add(MaskedInfo(record_id=record.id, **item))

    db.commit()
    db.refresh(record)
    return record


# ── 목록 조회 ─────────────────────────────────────────────────
@router.get("", response_model=List[RecordResponse])
def list_records(
    baby_id: Optional[int] = Query(None, description="아이 ID 필터"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """육아 기록 목록 조회 (필터링 + 페이지네이션)"""
    q = (
        db.query(Record)
        .options(joinedload(Record.masked_info))
        .filter(Record.user_id == user_id)
    )
    if baby_id:
        q = q.filter(Record.baby_id == baby_id)
    if category:
        q = q.filter(Record.category == category)
    if start_date:
        q = q.filter(Record.record_date >= start_date)
    if end_date:
        q = q.filter(Record.record_date <= end_date)

    return q.order_by(Record.record_date.desc()).offset(skip).limit(limit).all()


# ── 상세 조회 ─────────────────────────────────────────────────
@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return _get_record_or_404(record_id, user_id, db)


# ── 수정 ─────────────────────────────────────────────────────
@router.patch("/{record_id}", response_model=RecordResponse)
def update_record(
    record_id: int,
    body: RecordUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """기록 수정 (텍스트 변경 시 마스킹 재처리)"""
    record = _get_record_or_404(record_id, user_id, db)
    update_data = body.model_dump(exclude_none=True)

    # 텍스트가 변경되면 마스킹 재처리
    if "original_text" in update_data:
        ai_result = process_record(update_data["original_text"], update_data.get("category", record.category))
        update_data["masked_text"] = ai_result["masked_text"]
        update_data["category"] = ai_result["category"]

        # 기존 마스킹 정보 삭제 후 재저장
        db.query(MaskedInfo).filter(MaskedInfo.record_id == record.id).delete()
        for item in ai_result["masked_info"]:
            db.add(MaskedInfo(record_id=record.id, **item))

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


# ── 삭제 ─────────────────────────────────────────────────────
@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    record = _get_record_or_404(record_id, user_id, db)
    db.delete(record)
    db.commit()
