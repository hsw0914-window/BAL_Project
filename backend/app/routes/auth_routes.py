from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.database import get_connection
from app.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user_id,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ── Schemas ──────────────────────────────────────────
class UserRegister(BaseModel):
    username: str = Field(min_length=4, max_length=50)
    name: str = Field(min_length=1, max_length=50)
    email: str
    nickname: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


def _user_response(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "name": row["name"],
        "email": row["email"],
        "nickname": row["nickname"],
        "created_at": row["created_at"],
    }


def _token_response(user_row):
    uid = user_row["id"]
    return {
        "access_token": create_access_token(uid),
        "refresh_token": create_refresh_token(uid),
        "token_type": "bearer",
        "user": _user_response(user_row),
    }


# ── Routes ───────────────────────────────────────────
@router.post("/register", status_code=201)
def register(body: UserRegister):
    conn = get_connection()
    if conn.execute("SELECT id FROM users WHERE username = ?", (body.username,)).fetchone():
        conn.close()
        raise HTTPException(409, "이미 사용 중인 아이디입니다.")
    if conn.execute("SELECT id FROM users WHERE email = ?", (body.email,)).fetchone():
        conn.close()
        raise HTTPException(409, "이미 사용 중인 이메일입니다.")

    cursor = conn.execute(
        "INSERT INTO users (username, name, email, password_hash, nickname) VALUES (?, ?, ?, ?, ?)",
        (body.username, body.name, body.email, hash_password(body.password), body.nickname),
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()

    # 기존 orphan 데이터 자동 귀속
    conn.execute("UPDATE babies SET user_id = ? WHERE user_id IS NULL", (user["id"],))
    conn.execute("UPDATE records SET user_id = ? WHERE user_id IS NULL", (user["id"],))
    conn.commit()
    conn.close()
    return _token_response(user)


@router.post("/login")
def login(body: UserLogin):
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (body.username,)).fetchone()
    conn.close()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "아이디 또는 비밀번호가 올바르지 않습니다.")
    return _token_response(user)


@router.post("/refresh")
def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Refresh token이 필요합니다.")
    uid = int(payload["sub"])
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(401, "존재하지 않는 사용자입니다.")
    return {
        "access_token": create_access_token(uid),
        "refresh_token": body.refresh_token,
        "token_type": "bearer",
        "user": _user_response(user),
    }


@router.get("/me")
def get_me(user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    return _user_response(user)
