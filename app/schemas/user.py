from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    username: str        # 로그인용 아이디
    name: str            # 실명
    email: EmailStr
    nickname: str
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v

    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        if len(v.strip()) < 4:
            raise ValueError("아이디는 4자 이상이어야 합니다.")
        return v.strip()

    @field_validator("nickname")
    @classmethod
    def nickname_length(cls, v: str) -> str:
        if len(v.strip()) < 1:
            raise ValueError("닉네임을 입력해주세요.")
        return v.strip()

    @field_validator("name")
    @classmethod
    def name_length(cls, v: str) -> str:
        if len(v.strip()) < 1:
            raise ValueError("이름을 입력해주세요.")
        return v.strip()


class UserLogin(BaseModel):
    username: str        # 아이디로 로그인
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    nickname: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str