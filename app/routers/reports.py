from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Baby, Record
from app.models.category_models import (
    FormulaRecord, BreastfeedingRecord,
    SleepRecord, GrowthRecord,
)
from app.schemas.record import (
    ReportResponse, CategorySummary, RecordResponse,
    FeedingReportResponse, FeedingDailyItem,
    SleepReportResponse, SleepDailyItem,
    GrowthReportResponse, GrowthItem,
)

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


@router.get("/{baby_id}/feeding", response_model=FeedingReportResponse)
def get_feeding_report(
    baby_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """수유량 리포트 — 날짜별 분유 총량 + 모유 수유 총 시간"""
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")

    formula_rows = (
        db.query(
            cast(Record.record_date, Date).label("date"),
            func.sum(FormulaRecord.amount_ml).label("total_ml"),
            func.count(FormulaRecord.id).label("count"),
        )
        .join(FormulaRecord, FormulaRecord.record_id == Record.id)
        .filter(
            Record.baby_id == baby_id,
            Record.user_id == user_id,
            Record.record_date >= start_date,
            Record.record_date <= end_date,
        )
        .group_by(cast(Record.record_date, Date))
        .order_by(cast(Record.record_date, Date))
        .all()
    )

    breast_rows = (
        db.query(
            cast(Record.record_date, Date).label("date"),
            func.sum(BreastfeedingRecord.duration_min).label("total_min"),
            func.count(BreastfeedingRecord.id).label("count"),
        )
        .join(BreastfeedingRecord, BreastfeedingRecord.record_id == Record.id)
        .filter(
            Record.baby_id == baby_id,
            Record.user_id == user_id,
            Record.record_date >= start_date,
            Record.record_date <= end_date,
        )
        .group_by(cast(Record.record_date, Date))
        .order_by(cast(Record.record_date, Date))
        .all()
    )

    formula_by_date = {str(r.date): r for r in formula_rows}
    breast_by_date  = {str(r.date): r for r in breast_rows}
    all_dates = sorted(set(formula_by_date) | set(breast_by_date))

    daily = [
        FeedingDailyItem(
            date=d,
            formula_ml=int(formula_by_date[d].total_ml) if d in formula_by_date else 0,
            formula_count=formula_by_date[d].count if d in formula_by_date else 0,
            breast_min=int(breast_by_date[d].total_min) if d in breast_by_date else 0,
            breast_count=breast_by_date[d].count if d in breast_by_date else 0,
        )
        for d in all_dates
    ]

    days_count = len(daily) or 1
    total_formula_ml    = sum(item.formula_ml    for item in daily)
    total_breast_min    = sum(item.breast_min    for item in daily)
    total_formula_count = sum(item.formula_count for item in daily)
    total_breast_count  = sum(item.breast_count  for item in daily)

    return FeedingReportResponse(
        baby_id=baby_id,
        start_date=start_date,
        end_date=end_date,
        avg_daily_formula_ml=round(total_formula_ml / days_count, 1),
        avg_daily_breast_min=round(total_breast_min / days_count, 1),
        avg_breast_per_day=round(total_breast_count / days_count, 1),
        total_feeds=total_formula_count + total_breast_count,
        daily=daily,
    )


@router.get("/{baby_id}/sleep", response_model=SleepReportResponse)
def get_sleep_report(
    baby_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """수면 패턴 리포트 — 날짜별 낮잠 / 야간수면 시간"""
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")

    sleep_rows = (
        db.query(
            cast(Record.record_date, Date).label("date"),
            SleepRecord.sleep_type,
            func.sum(SleepRecord.duration_min).label("total_min"),
            func.count(SleepRecord.id).label("count"),
        )
        .join(SleepRecord, SleepRecord.record_id == Record.id)
        .filter(
            Record.baby_id == baby_id,
            Record.user_id == user_id,
            Record.record_date >= start_date,
            Record.record_date <= end_date,
        )
        .group_by(cast(Record.record_date, Date), SleepRecord.sleep_type)
        .order_by(cast(Record.record_date, Date))
        .all()
    )

    by_date: dict = {}
    for row in sleep_rows:
        d = str(row.date)
        if d not in by_date:
            by_date[d] = {}
        by_date[d][row.sleep_type] = row

    daily = [
        SleepDailyItem(
            date=d,
            night_min=int(by_date[d]["야간수면"].total_min) if "야간수면" in by_date[d] else 0,
            nap_min=int(by_date[d]["낮잠"].total_min) if "낮잠" in by_date[d] else 0,
            nap_count=by_date[d]["낮잠"].count if "낮잠" in by_date[d] else 0,
        )
        for d in sorted(by_date)
    ]

    days_count    = len(daily) or 1
    avg_night     = round(sum(i.night_min  for i in daily) / days_count / 60, 1)
    avg_nap       = round(sum(i.nap_min    for i in daily) / days_count / 60, 1)
    avg_nap_count = round(sum(i.nap_count  for i in daily) / days_count, 1)

    return SleepReportResponse(
        baby_id=baby_id,
        start_date=start_date,
        end_date=end_date,
        avg_total_hours=round(avg_night + avg_nap, 1),
        avg_night_hours=avg_night,
        avg_nap_hours=avg_nap,
        avg_nap_count=avg_nap_count,
        daily=daily,
    )


@router.get("/{baby_id}/growth", response_model=GrowthReportResponse)
def get_growth_report(
    baby_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """성장 곡선 리포트 — 전체 기간 몸무게 / 키 / 두위 추이"""
    baby = db.query(Baby).filter(Baby.id == baby_id, Baby.user_id == user_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")

    rows = (
        db.query(
            cast(Record.record_date, Date).label("date"),
            GrowthRecord.weight_kg,
            GrowthRecord.height_cm,
            GrowthRecord.head_cm,
        )
        .join(GrowthRecord, GrowthRecord.record_id == Record.id)
        .filter(Record.baby_id == baby_id, Record.user_id == user_id)
        .order_by(cast(Record.record_date, Date))
        .all()
    )

    items = [
        GrowthItem(
            date=str(row.date),
            weight_kg=row.weight_kg,
            height_cm=row.height_cm,
            head_cm=row.head_cm,
        )
        for row in rows
    ]

    latest = items[-1] if items else None

    return GrowthReportResponse(
        baby_id=baby_id,
        latest_weight_kg=latest.weight_kg if latest else None,
        latest_height_cm=latest.height_cm if latest else None,
        latest_head_cm=latest.head_cm if latest else None,
        items=items,
    )
