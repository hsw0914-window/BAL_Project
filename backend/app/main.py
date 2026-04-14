import os
import glob
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.ocr_routes import router as ocr_router
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


@app.get("/")
def root():
    return {"message": "BabyAutoLog-AI 서버 실행 중", "docs": "/docs"}
