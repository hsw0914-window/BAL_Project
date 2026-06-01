from typing import Optional
from fastapi import APIRouter, Query, Depends
from app.database import get_connection
from app.security import get_current_user_id
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/stats", tags=["Stats"])


def _since_date(days: int) -> str:
    return (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")


def _user_filter(baby_id: Optional[int], user_id: int):
    if baby_id:
        return "r.user_id = ? AND r.baby_id = ?", (user_id, baby_id)
    return "r.user_id = ?", (user_id,)


@router.get("/feeding")
def get_feeding_stats(
    days: int = Query(7, ge=1, le=90),
    baby_id: Optional[int] = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    conn = get_connection()
    since = _since_date(days)
    uf, up = _user_filter(baby_id, user_id)

    formula = conn.execute(f"""
        SELECT DATE(r.created_at) as date,
               SUM(COALESCE(f.amount_ml, 0)) as amount_ml,
               COUNT(*) as count
        FROM records r
        JOIN formula_records f ON r.id = f.record_id
        WHERE r.category = '분유기록' AND DATE(r.created_at) >= ? AND {uf}
        GROUP BY DATE(r.created_at)
        ORDER BY date ASC
    """, (since, *up)).fetchall()

    breast = conn.execute(f"""
        SELECT DATE(r.created_at) as date,
               SUM(COALESCE(b.duration_min, 0)) as duration_min,
               COUNT(*) as count
        FROM records r
        JOIN breastfeeding_records b ON r.id = b.record_id
        WHERE r.category = '모유기록' AND DATE(r.created_at) >= ? AND {uf}
        GROUP BY DATE(r.created_at)
        ORDER BY date ASC
    """, (since, *up)).fetchall()

    conn.close()
    return {
        "formula": [dict(row) for row in formula],
        "breastfeeding": [dict(row) for row in breast],
    }


@router.get("/sleep")
def get_sleep_stats(
    days: int = Query(7, ge=1, le=90),
    baby_id: Optional[int] = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    conn = get_connection()
    since = _since_date(days)
    uf, up = _user_filter(baby_id, user_id)

    rows = conn.execute(f"""
        SELECT DATE(r.created_at) as date,
               COALESCE(s.sleep_type, '알수없음') as sleep_type,
               SUM(COALESCE(s.duration_min, 0)) as duration_min
        FROM records r
        JOIN sleep_records s ON r.id = s.record_id
        WHERE r.category = '수면기록' AND DATE(r.created_at) >= ? AND {uf}
        GROUP BY DATE(r.created_at), s.sleep_type
        ORDER BY date ASC
    """, (since, *up)).fetchall()

    conn.close()
    return [dict(row) for row in rows]


@router.get("/growth")
def get_growth_stats(
    baby_id: Optional[int] = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    conn = get_connection()
    uf, up = _user_filter(baby_id, user_id)

    rows = conn.execute(f"""
        SELECT DATE(r.created_at) as date,
               g.height_cm, g.weight_kg, g.head_cm
        FROM records r
        JOIN growth_records g ON r.id = g.record_id
        WHERE r.category = '성장기록' AND {uf}
        ORDER BY r.created_at ASC
    """, up).fetchall()

    conn.close()
    return [dict(row) for row in rows]


@router.get("/summary")
def get_summary_stats(
    days: int = Query(7, ge=1, le=90),
    baby_id: Optional[int] = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    conn = get_connection()
    since = _since_date(days)

    if baby_id:
        base_where = "user_id = ? AND baby_id = ? AND DATE(created_at) >= ?"
        base_params = (user_id, baby_id, since)
    else:
        base_where = "user_id = ? AND DATE(created_at) >= ?"
        base_params = (user_id, since)

    def count_category(category):
        return conn.execute(
            f"SELECT COUNT(*) as c FROM records WHERE category = ? AND {base_where}",
            (category, *base_params),
        ).fetchone()["c"]

    total = conn.execute(
        f"SELECT COUNT(*) as c FROM records WHERE {base_where}",
        base_params,
    ).fetchone()["c"]

    result = {
        "total_records": total,
        "diaper_count": count_category("기저귀기록"),
        "hospital_count": count_category("병원기록"),
        "health_count": count_category("건강기록"),
    }

    conn.close()
    return result
