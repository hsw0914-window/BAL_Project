# BAL_Project
설치 → 실행 → 테스트
1. 가상환경 생성 & 패키지 설치

cd BabyAutoLog-AI/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
2. FastAPI 서버 실행

# backend/ 폴더 안에서
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
→ 브라우저에서 http://localhost:8000/docs 열면 Swagger UI로 바로 테스트 가능

3. 기능별 단독 테스트 (서버 없이)

# 마스킹만 (이미지 불필요, 가장 빠름)
python tests/mask_test.py

# OCR + 전처리 (이미지 필요)
python tests/ocr_test.py ../OCR/images/sample.png

# 문서 보정만
python tests/scan_test.py ../OCR/images/sample.png
4. API 요청 예시 (curl)

curl -X POST http://localhost:8000/api/ocr/upload \
  -F "file=@병원문서.png"
응답 예시

{
  "status": "success",
  "original_text": "성명: 김철수\n주민등록번호: 850123-1234567\n전화번호: 010-1234-5678",
  "masked_text": "성명: ***\n주민등록번호: ******-*******\n전화번호: ***-****-****",
  "detected": [
    {"type": "이름", "original": "성명: 김철수"},
    {"type": "주민등록번호", "original": "850123-1234567"},
    {"type": "전화번호", "original": "010-1234-5678"}
  ],
  "message": ""
}