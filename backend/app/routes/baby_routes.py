from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.database import get_connection

router = APIRouter(prefix="/api/baby", tags=["Baby"])


class BabyRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None      # "남아" | "여아"
    birth_date: Optional[str] = None  # "YYYY-MM-DD"


def _row_to_dict(row):
    if not row:
        return None
    return {
        "id":         row["id"],
        "name":       row["name"],
        "gender":     row["gender"],
        "birth_date": row["birth_date"],
    }


@router.get("")
def get_baby():
    conn = get_connection()
    row = conn.execute("SELECT * FROM babies ORDER BY id ASC LIMIT 1").fetchone()
    conn.close()
    return _row_to_dict(row)


@router.put("")
def update_baby(req: BabyRequest):
    conn = get_connection()
    existing = conn.execute("SELECT id FROM babies ORDER BY id ASC LIMIT 1").fetchone()
    if existing:
        conn.execute(
            "UPDATE babies SET name=?, gender=?, birth_date=? WHERE id=?",
            (req.name, req.gender, req.birth_date, existing["id"]),
        )
    else:
        conn.execute(
            "INSERT INTO babies (name, gender, birth_date) VALUES (?, ?, ?)",
            (req.name, req.gender, req.birth_date),
        )
    conn.commit()
    row = conn.execute("SELECT * FROM babies ORDER BY id ASC LIMIT 1").fetchone()
    conn.close()
    return _row_to_dict(row)
