from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Baby, Record
from app.schemas.record import ReportResponse, CategorySummary, RecordResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{baby_id}", response_model=ReportResponse)
def get_report(
    baby_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """기간별 육아 리포트 조회"""
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="시작일이 종료일보다 늦을 수 없습니다.")

    # 카테고리 집계 - Python 대신 DB GROUP BY로 처리
    category_rows = (
        db.query(Record.category, func.count(Record.id).label("cnt"))
        .filter(
            Record.baby_id == baby_id,
            Record.user_id == user_id,
            Record.record_date >= start_date,
            Record.record_date <= end_date,
        )
        .group_by(Record.category)
        .order_by(func.count(Record.id).desc())
        .all()
    )

    by_category = [CategorySummary(category=row.category, count=row.cnt) for row in category_rows]
    total_count = sum(row.cnt for row in category_rows)

    # 기록 목록 조회
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

    return ReportResponse(
        baby_id=baby_id,
        start_date=start_date,
        end_date=end_date,
        total_count=total_count,
        by_category=by_category,
        records=[RecordResponse.model_validate(r) for r in records],
    )