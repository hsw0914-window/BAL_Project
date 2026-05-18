import os
import uuid
import imghdr
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Baby, Record, MaskedInfo
from app.schemas.record import RecordCreate, RecordUpdate, RecordResponse
from app.services.ai_service import process_record

settings = get_settings()
router = APIRouter(prefix="/records", tags=["Records"])

ALLOWED_IMAGE_TYPES = {"jpeg", "png", "webp"}


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


def _delete_image_file(image_path: str) -> None:
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except OSError:
            pass


@router.post("", response_model=RecordResponse, status_code=201)
def create_record(
    body: RecordCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """육아 기록 저장 (AI 자동 분류 + 마스킹 포함)"""
    _verify_baby_owner(body.baby_id, user_id, db)

    if body.ended_at and body.ended_at < body.started_at:
        raise HTTPException(status_code=422, detail="ended_at은 started_at보다 이후여야 합니다.")

    ai_result = process_record(body.original_text or "", body.category)

    record = Record(
        user_id=user_id,
        baby_id=body.baby_id,
        category=ai_result["category"],
        original_text=body.original_text,
        masked_text=ai_result["masked_text"],
        image_path=body.image_path,
        started_at=body.started_at,   # 사용자가 지정한 날짜/시간
        ended_at=body.ended_at,        # 종료 시간 (선택)
    )
    db.add(record)
    db.flush()

    items = body.masked_info if body.masked_info else ai_result["masked_info"]
    for item in items:
        mi = item if isinstance(item, dict) else item.model_dump()
        db.add(MaskedInfo(record_id=record.id, **mi))

    db.commit()
    db.refresh(record)
    return record


@router.post("/with-image", response_model=RecordResponse, status_code=201)
async def create_record_with_image(
    baby_id: int = Form(...),
    category: Optional[str] = Form(None),
    original_text: Optional[str] = Form(None),
    started_at: datetime = Form(...),          # 사용자가 지정한 날짜/시간
    ended_at: Optional[datetime] = Form(None), # 종료 시간 (선택)
    image: Optional[UploadFile] = File(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """이미지 첨부 기록 저장"""
    _verify_baby_owner(baby_id, user_id, db)

    if ended_at and ended_at < started_at:
        raise HTTPException(status_code=422, detail="ended_at은 started_at보다 이후여야 합니다.")

    image_path = None
    if image:
        content = await image.read()
        actual_type = imghdr.what(None, h=content)
        if actual_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다. (jpeg/png/webp만 가능)")
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.{actual_type}"
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
        started_at=started_at,
        ended_at=ended_at,
    )
    db.add(record)
    db.flush()

    for item in ai_result["masked_info"]:
        db.add(MaskedInfo(record_id=record.id, **item))

    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}/image")
def get_record_image(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """기록 이미지 조회 - 본인 기록만 접근 가능"""
    record = _get_record_or_404(record_id, user_id, db)
    if not record.image_path:
        raise HTTPException(status_code=404, detail="이미지가 없는 기록입니다.")
    if not os.path.exists(record.image_path):
        raise HTTPException(status_code=404, detail="이미지 파일을 찾을 수 없습니다.")
    return FileResponse(record.image_path)


@router.get("", response_model=List[RecordResponse])
def list_records(
    baby_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """육아 기록 목록 조회 (started_at 기준 필터링)"""
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
        q = q.filter(Record.started_at >= start_date)
    if end_date:
        q = q.filter(Record.started_at <= end_date)

    return q.order_by(Record.started_at.desc()).offset(skip).limit(limit).all()


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return _get_record_or_404(record_id, user_id, db)


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

    # started_at / ended_at 유효성 체크
    new_started = update_data.get("started_at", record.started_at)
    new_ended   = update_data.get("ended_at",   record.ended_at)
    if new_ended and new_ended < new_started:
        raise HTTPException(status_code=422, detail="ended_at은 started_at보다 이후여야 합니다.")

    if "original_text" in update_data:
        ai_result = process_record(update_data["original_text"], update_data.get("category", record.category))
        update_data["masked_text"] = ai_result["masked_text"]
        update_data["category"]    = ai_result["category"]
        db.query(MaskedInfo).filter(MaskedInfo.record_id == record.id).delete()
        for item in ai_result["masked_info"]:
            db.add(MaskedInfo(record_id=record.id, **item))

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """기록 삭제 (이미지 파일도 같이 삭제)"""
    record = _get_record_or_404(record_id, user_id, db)
    _delete_image_file(record.image_path)
    db.delete(record)
    db.commit()
