from fastapi import APIRouter, Query
from app.database import get_connection
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/stats", tags=["Stats"])


def _since_date(days: int) -> str:
    return (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")


@router.get("/feeding")
def get_feeding_stats(days: int = Query(7, ge=1, le=90)):
    """분유 + 모유 수유 통계 (일별)"""
    conn = get_connection()
    since = _since_date(days)

    formula = conn.execute("""
        SELECT DATE(r.created_at) as date,
               SUM(COALESCE(f.amount_ml, 0)) as amount_ml,
               COUNT(*) as count
        FROM records r
        JOIN formula_records f ON r.id = f.record_id
        WHERE r.category = '분유기록' AND DATE(r.created_at) >= ?
        GROUP BY DATE(r.created_at)
        ORDER BY date ASC
    """, (since,)).fetchall()

    breast = conn.execute("""
        SELECT DATE(r.created_at) as date,
               SUM(COALESCE(b.duration_min, 0)) as duration_min,
               COUNT(*) as count
        FROM records r
        JOIN breastfeeding_records b ON r.id = b.record_id
        WHERE r.category = '모유기록' AND DATE(r.created_at) >= ?
        GROUP BY DATE(r.created_at)
        ORDER BY date ASC
    """, (since,)).fetchall()

    conn.close()
    return {
        "formula": [dict(row) for row in formula],
        "breastfeeding": [dict(row) for row in breast],
    }


@router.get("/sleep")
def get_sleep_stats(days: int = Query(7, ge=1, le=90)):
    """수면 패턴 통계 (일별, 낮잠/야간 구분)"""
    conn = get_connection()
    since = _since_date(days)

    rows = conn.execute("""
        SELECT DATE(r.created_at) as date,
               COALESCE(s.sleep_type, '알수없음') as sleep_type,
               SUM(COALESCE(s.duration_min, 0)) as duration_min
        FROM records r
        JOIN sleep_records s ON r.id = s.record_id
        WHERE r.category = '수면기록' AND DATE(r.created_at) >= ?
        GROUP BY DATE(r.created_at), s.sleep_type
        ORDER BY date ASC
    """, (since,)).fetchall()

    conn.close()
    return [dict(row) for row in rows]


@router.get("/growth")
def get_growth_stats():
    """성장 기록 전체 (시간순)"""
    conn = get_connection()

    rows = conn.execute("""
        SELECT DATE(r.created_at) as date,
               g.height_cm, g.weight_kg, g.head_cm
        FROM records r
        JOIN growth_records g ON r.id = g.record_id
        WHERE r.category = '성장기록'
        ORDER BY r.created_at ASC
    """).fetchall()

    conn.close()
    return [dict(row) for row in rows]


@router.get("/summary")
def get_summary_stats(days: int = Query(7, ge=1, le=90)):
    """주요 지표 숫자 요약"""
    conn = get_connection()
    since = _since_date(days)

    def count_category(category):
        return conn.execute(
            "SELECT COUNT(*) as c FROM records WHERE category = ? AND DATE(created_at) >= ?",
            (category, since),
        ).fetchone()["c"]

    total = conn.execute(
        "SELECT COUNT(*) as c FROM records WHERE DATE(created_at) >= ?", (since,)
    ).fetchone()["c"]

    result = {
        "total_records": total,
        "diaper_count": count_category("기저귀기록"),
        "hospital_count": count_category("병원기록"),
        "health_count": count_category("건강기록"),
    }

    conn.close()
    return result
