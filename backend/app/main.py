import os
import glob
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.ocr_routes import router as ocr_router
from app.routes.record_routes import router as record_router
from app.routes.stats_routes import router as stats_router
from app.routes.baby_routes import router as baby_router
from app.routes.auth_routes import router as auth_router
from app.database import init_db
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 서버 시작 시 이전 결과 파일 자동 삭제
for pattern in [f"{UPLOAD_DIR}/*", f"{OUTPUT_DIR}/*"]:
    for f in glob.glob(pattern):
        if os.path.isfile(f):
            os.remove(f)

app = FastAPI(
    title="BabyAutoLog-AI API",
    description="병원 서류 OCR + 민감정보 이미지 마스킹",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 마스킹된 이미지 정적 파일 서빙 (/output/masked_xxx.png)
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

app.include_router(ocr_router)
app.include_router(record_router)
app.include_router(stats_router)
app.include_router(baby_router)
app.include_router(auth_router)


@app.on_event("startup")
async def startup():
    print("[DEBUG] === DB 관련 환경변수 목록 ===")
    for key, val in os.environ.items():
        if any(x in key.upper() for x in ['DATABASE', 'POSTGRES', 'PG', 'DB']):
            print(f"[DEBUG] {key} = {val[:40]}...")
    print("[DEBUG] ==============================")
    try:
        init_db()
        print("[DEBUG] DB 초기화 성공")
    except Exception as e:
        print(f"[DEBUG] DB 초기화 실패: {e}")


@app.get("/")
def root():
    return {"message": "BabyAutoLog-AI 서버 실행 중", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
