import os
import secrets
import httpx
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.database import get_connection
from app.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user_id,
)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_DEVICE_URL = "https://oauth2.googleapis.com/device/code"

router = APIRouter(prefix="/api/auth", tags=["Auth"])


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


class GoogleLoginRequest(BaseModel):
    id_token: str


class GoogleDevicePollRequest(BaseModel):
    device_code: str


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


@router.post("/google")
async def google_login(body: GoogleLoginRequest):
    """Google id_token (네이티브 SDK) 검증 → 사용자 정보 추출 → 로그인/가입."""
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": body.id_token},
        )
    if r.status_code != 200:
        raise HTTPException(401, f"Google id_token 검증 실패: {r.text}")
    info = r.json()
    email = info.get("email")
    name = info.get("name") or (email.split("@")[0] if email else "Google User")
    sub = info.get("sub")
    if not email or not sub:
        raise HTTPException(400, "Google 응답에 필수 정보가 없습니다.")

    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        base_username = f"g_{sub[-10:]}"
        username = base_username
        i = 0
        while conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
            i += 1
            username = f"{base_username}_{i}"
        random_secret = secrets.token_urlsafe(32)
        cursor = conn.execute(
            "INSERT INTO users (username, name, email, password_hash, nickname) VALUES (?, ?, ?, ?, ?)",
            (username, name, email, hash_password(random_secret), name),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
        conn.execute("UPDATE babies SET user_id = ? WHERE user_id IS NULL", (user["id"],))
        conn.execute("UPDATE records SET user_id = ? WHERE user_id IS NULL", (user["id"],))
        conn.commit()
    conn.close()
    return _token_response(user)


async def _user_from_google_userinfo(info: dict):
    email = info.get("email")
    name = info.get("name") or (email.split("@")[0] if email else "Google User")
    sub = info.get("sub")
    if not email or not sub:
        raise HTTPException(400, "Google 응답에 필수 정보가 없습니다.")
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        base_username = f"g_{sub[-10:]}"
        username = base_username
        i = 0
        while conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
            i += 1
            username = f"{base_username}_{i}"
        random_secret = secrets.token_urlsafe(32)
        cursor = conn.execute(
            "INSERT INTO users (username, name, email, password_hash, nickname) VALUES (?, ?, ?, ?, ?)",
            (username, name, email, hash_password(random_secret), name),
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
        conn.execute("UPDATE babies SET user_id = ? WHERE user_id IS NULL", (user["id"],))
        conn.execute("UPDATE records SET user_id = ? WHERE user_id IS NULL", (user["id"],))
        conn.commit()
    conn.close()
    return _token_response(user)


@router.post("/google/device-init")
async def google_device_init():
    """Google Device Flow 시작 — user_code, verification_url, device_code 반환."""
    client_id = os.getenv("GOOGLE_TV_CLIENT_ID")
    if not client_id:
        raise HTTPException(500, "GOOGLE_TV_CLIENT_ID 가 설정되지 않았습니다.")
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(GOOGLE_DEVICE_URL, data={
            "client_id": client_id,
            "scope": "openid email profile",
        })
    if r.status_code != 200:
        raise HTTPException(500, f"Google device-code 요청 실패: {r.text}")
    return r.json()


@router.post("/google/device-poll")
async def google_device_poll(body: GoogleDevicePollRequest):
    """Google Device Flow 폴링 — 사용자가 코드 입력 + 로그인 완료 시 JWT 반환."""
    client_id = os.getenv("GOOGLE_TV_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_TV_CLIENT_SECRET")
    async with httpx.AsyncClient(timeout=10) as http:
        token_res = await http.post(GOOGLE_TOKEN_URL, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "device_code": body.device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        })
    payload = token_res.json()
    if token_res.status_code != 200:
        err = payload.get("error")
        if err in ("authorization_pending", "slow_down"):
            return {"status": "pending"}
        raise HTTPException(401, f"Device flow 오류: {err or payload}")
    access_token = payload.get("access_token")
    if not access_token:
        raise HTTPException(401, "access_token 미수신")
    async with httpx.AsyncClient(timeout=10) as http:
        info_res = await http.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if info_res.status_code != 200:
        raise HTTPException(401, "사용자 정보 조회 실패")
    res = await _user_from_google_userinfo(info_res.json())
    return {"status": "ok", **res}


@router.get("/me")
def get_me(user_id: int = Depends(get_current_user_id)):
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    return _user_response(user)
