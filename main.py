from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os


from app.core.config import get_settings
from app.core.database import Base, engine, SessionLocal
from app.models.models import User, Baby, Record, MaskedInfo
from app.routers import auth, babies, records, reports
from datetime import date, datetime

settings = get_settings()


def insert_sample_data():
    db = SessionLocal()
    try:
        if db.query(User).first():
            return

        user = User(
            username="testmom",
            name="김테스트",
            email="test@example.com",
            password_hash="$2b$12$placeholder_hash_here",
            nickname="테스트맘",
        )
        db.add(user)
        db.flush()

        baby = Baby(user_id=user.id, name="민준", birth_date=date(2024, 3, 15), gender="male")
        db.add(baby)
        db.flush()

        record = Record(
            user_id=user.id, baby_id=baby.id,
            category="feeding",
            original_text="오전 10시 서울아동병원 김철수 의사 진료 후 분유 200ml 수유",
            masked_text="오전 10시 **병원 **의사 진료 후 분유 200ml 수유",
            record_date=datetime(2025, 1, 10, 10, 30, 0),
        )
        db.add(record)
        db.flush()

        db.add(MaskedInfo(record_id=record.id, info_type="hospital", original_value="서울아동병원", masked_value="**병원"))
        db.add(MaskedInfo(record_id=record.id, info_type="doctor", original_value="김철수 의사", masked_value="**의사"))
        db.commit()
    finally:
        db.close()


# DB 테이블 자동 생성 + 샘플 데이터 삽입 (테스트 환경 제외 / 운영 시 Alembic 권장)
if os.getenv("TESTING") != "1":
    Base.metadata.create_all(bind=engine)
    insert_sample_data()

app = FastAPI(
    title="BabyCare API",
    description="육아 기록 관리 서비스 - React Native 연동",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - React Native 개발 환경 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 운영 시 도메인 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 이미지 업로드 정적 파일 서빙
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# 라우터 등록
app.include_router(auth.router,    prefix="/api/v1")
app.include_router(babies.router,  prefix="/api/v1")
app.include_router(records.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "BabyCare API is running 🍼"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}