import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY", "")
UPSTAGE_OCR_URL = "https://api.upstage.ai/v1/document-ai/ocr"


def _normalize_box(vertices: list) -> dict:
    """vertices 배열 → {x1, y1, x2, y2} 직사각형으로 변환"""
    xs = [v["x"] for v in vertices]
    ys = [v["y"] for v in vertices]
    return {"x1": min(xs), "y1": min(ys), "x2": max(xs), "y2": max(ys)}


async def extract_ocr_result(file_bytes: bytes, filename: str) -> dict:
    """
    Upstage API 호출 → 텍스트 + 단어별 좌표 반환
    반환 형식:
        text: str
        words: [{"text": str, "box": {"x1","y1","x2","y2"}}]
    """
    if not UPSTAGE_API_KEY:
        raise HTTPException(status_code=500, detail="UPSTAGE_API_KEY가 .env에 설정되지 않았습니다.")

    headers = {"Authorization": f"Bearer {UPSTAGE_API_KEY}"}
    files = {"document": (filename, file_bytes)}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(UPSTAGE_OCR_URL, headers=headers, files=files)

    if response.status_code == 401:
        raise HTTPException(status_code=500, detail="Upstage API 키가 유효하지 않습니다.")
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Upstage API 오류: {response.status_code} - {response.text}"
        )

    data = response.json()
    pages = data.get("pages", [])

    full_text_parts = []
    all_words = []

    for page in pages:
        full_text_parts.append(page.get("text", ""))
        for word in page.get("words", []):
            vertices = word.get("boundingBox", {}).get("vertices", [])
            if vertices:
                all_words.append({
                    "text": word.get("text", ""),
                    "box": _normalize_box(vertices),
                })

    return {
        "text": "\n".join(full_text_parts).strip(),
        "words": all_words,
    }
