from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.classify_service import classify_record
from app.database import get_connection

router = APIRouter(prefix="/api/records", tags=["Records"])


class RecordRequest(BaseModel):
    text: str


# 카테고리별 자식 테이블 INSERT 쿼리
def insert_category_detail(conn, category: str, record_id: int, result: dict):
    if category == "모유기록":
        conn.execute(
            "INSERT INTO breastfeeding_records (record_id, duration_min) VALUES (?, ?)",
            (record_id, result.get("duration_min")),
        )
    elif category == "분유기록":
        conn.execute(
            "INSERT INTO formula_records (record_id, amount_ml) VALUES (?, ?)",
            (record_id, result.get("amount_ml")),
        )
    elif category == "이유식기록":
        conn.execute(
            "INSERT INTO baby_food_records (record_id, food_name, amount_g, reaction) VALUES (?, ?, ?, ?)",
            (record_id, result.get("food_name"), result.get("amount_g"), result.get("reaction")),
        )
    elif category == "기저귀기록":
        conn.execute(
            "INSERT INTO diaper_records (record_id, type) VALUES (?, ?)",
            (record_id, result.get("type")),
        )
    elif category == "수면기록":
        conn.execute(
            "INSERT INTO sleep_records (record_id, sleep_type, duration_min) VALUES (?, ?, ?)",
            (record_id, result.get("sleep_type"), result.get("duration_min")),
        )
    elif category == "성장기록":
        conn.execute(
            "INSERT INTO growth_records (record_id, height_cm, weight_kg, head_cm) VALUES (?, ?, ?, ?)",
            (record_id, result.get("height_cm"), result.get("weight_kg"), result.get("head_cm")),
        )
    elif category == "발달기록":
        conn.execute(
            "INSERT INTO development_records (record_id, milestone) VALUES (?, ?)",
            (record_id, result.get("milestone")),
        )
    elif category == "건강기록":
        conn.execute(
            "INSERT INTO health_records (record_id, temperature, medicine, symptom) VALUES (?, ?, ?, ?)",
            (record_id, result.get("temperature"), result.get("medicine"), result.get("symptom")),
        )
    elif category == "병원기록":
        conn.execute(
            "INSERT INTO hospital_records (record_id, hospital_name, purpose, prescription) VALUES (?, ?, ?, ?)",
            (record_id, result.get("hospital_name"), result.get("purpose"), result.get("prescription")),
        )
    elif category == "일상기록":
        conn.execute(
            "INSERT INTO daily_records (record_id, memo) VALUES (?, ?)",
            (record_id, result.get("memo")),
        )


# 카테고리별 자식 테이블 조회
def fetch_category_detail(conn, category: str, record_id: int) -> dict:
    table_map = {
        "모유기록":  "breastfeeding_records",
        "분유기록":  "formula_records",
        "이유식기록": "baby_food_records",
        "기저귀기록": "diaper_records",
        "수면기록":  "sleep_records",
        "성장기록":  "growth_records",
        "발달기록":  "development_records",
        "건강기록":  "health_records",
        "병원기록":  "hospital_records",
        "일상기록":  "daily_records",
    }
    table = table_map.get(category)
    if not table:
        return {}
    row = conn.execute(
        f"SELECT * FROM {table} WHERE record_id = ?", (record_id,)
    ).fetchone()
    if not row:
        return {}
    data = dict(row)
    data.pop("id", None)
    data.pop("record_id", None)
    return data


@router.post("")
async def create_record(req: RecordRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="텍스트를 입력해주세요.")

    results = await classify_record(req.text)

    conn = get_connection()
    saved = []
    for result in results:
        category = result["category"]
        summary = result.get("summary", "")

        cursor = conn.execute(
            "INSERT INTO records (category, original_text, summary) VALUES (?, ?, ?)",
            (category, req.text, summary),
        )
        record_id = cursor.lastrowid

        insert_category_detail(conn, category, record_id, result)

        detail = {k: v for k, v in result.items() if k not in ("category", "summary")}
        saved.append({
            "id": record_id,
            "category": category,
            "summary": summary,
            "detail": detail,
            "original_text": req.text,
        })

    conn.commit()
    conn.close()
    return saved


@router.get("")
def get_records():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM records ORDER BY created_at DESC"
    ).fetchall()
    result = []
    for row in rows:
        record = dict(row)
        record["detail"] = fetch_category_detail(conn, record["category"], record["id"])
        result.append(record)
    conn.close()
    return result


@router.get("/{category}")
def get_records_by_category(category: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM records WHERE category = ? ORDER BY created_at DESC",
        (category,),
    ).fetchall()
    result = []
    for row in rows:
        record = dict(row)
        record["detail"] = fetch_category_detail(conn, record["category"], record["id"])
        result.append(record)
    conn.close()
    return result


@router.delete("/{record_id}")
def delete_record(record_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return {"message": "삭제되었습니다."}
