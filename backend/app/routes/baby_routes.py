from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_connection
from app.security import get_current_user_id

router = APIRouter(prefix="/api/babies", tags=["Baby"])


class BabyRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None


def _row_to_dict(row):
    if not row:
        return None
    return {
        "id":         row["id"],
        "user_id":    row["user_id"],
        "name":       row["name"],
        "gender":     row["gender"],
        "birth_date": row["birth_date"],
    }


@router.get("")
def list_babies(user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM babies WHERE user_id = ? ORDER BY id ASC", (user_id,)
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


@router.post("", status_code=201)
def create_baby(req: BabyRequest, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO babies (user_id, name, gender, birth_date) VALUES (?, ?, ?, ?)",
        (user_id, req.name, req.gender, req.birth_date),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM babies WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return _row_to_dict(row)


@router.put("/{baby_id}")
def update_baby(baby_id: int, req: BabyRequest, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    existing = conn.execute(
        "SELECT * FROM babies WHERE id = ? AND user_id = ?", (baby_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "아기 정보를 찾을 수 없습니다.")
    conn.execute(
        "UPDATE babies SET name=?, gender=?, birth_date=? WHERE id=?",
        (req.name, req.gender, req.birth_date, baby_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM babies WHERE id = ?", (baby_id,)).fetchone()
    conn.close()
    return _row_to_dict(row)


@router.delete("/{baby_id}")
def delete_baby(baby_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    existing = conn.execute(
        "SELECT * FROM babies WHERE id = ? AND user_id = ?", (baby_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "아기 정보를 찾을 수 없습니다.")
    conn.execute("DELETE FROM records WHERE baby_id = ?", (baby_id,))
    conn.execute("DELETE FROM babies WHERE id = ?", (baby_id,))
    conn.commit()
    conn.close()
    return {"message": "삭제되었습니다."}
