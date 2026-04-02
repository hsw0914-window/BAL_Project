from datetime import datetime
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Baby, Record
from app.schemas.record import ReportResponse, CategorySummary, RecordResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{baby_id}", response_model=ReportResponse)
def get_report(
    baby_id: int,
    start_date: datetime = Query(..., description="조회 시작일 (예: 2025-01-01T00:00:00)"),
    end_date: datetime = Query(..., description="조회 종료일 (예: 2025-01-31T23:59:59)"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    기간별 육아 리포트 조회
    - 카테고리별 기록 횟수 집계
    - 전체 기록 목록 포함
    """
    # 아이 소유 확인
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="시작일이 종료일보다 늦을 수 없습니다.")

    records = (
        db.query(Record)
        .options(joinedload(Record.masked_info))
        .filter(
            Record.baby_id == baby_id,
            Record.user_id == user_id,
            Record.record_date >= start_date,
            Record.record_date <= end_date,
        )
        .order_by(Record.record_date.asc())
        .all()
    )

    category_counts = Counter(r.category for r in records)
    by_category = [
        CategorySummary(category=cat, count=cnt)
        for cat, cnt in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    return ReportResponse(
        baby_id=baby_id,
        start_date=start_date,
        end_date=end_date,
        total_count=len(records),
        by_category=by_category,
        records=[RecordResponse.model_validate(r) for r in records],
    )
