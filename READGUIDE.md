# BabyAutoLog-AI - 설치 및 실행 가이드

병원 서류(처방전 등) 이미지를 촬영하면 OCR로 텍스트를 추출하고,
민감정보(이름, 주민번호 등)를 자동으로 마스킹해주는 앱입니다.

---

## 파일 구조

```
BabyAutoLog-AI/
├── .gitignore
├── README.md
├── READGUIDE.md                  # 이 파일
│
├── backend/                      # FastAPI 백엔드 서버
│   ├── .env                      # 환경변수 (API 키 등, git 미포함)
│   ├── .env.example              # 환경변수 예시 파일
│   ├── requirements.txt          # Python 패키지 목록
│   ├── uploads/                  # 업로드된 이미지 임시 저장 (자동 생성)
│   ├── output/                   # 마스킹된 결과 이미지 저장 (자동 생성)
│   ├── app/
│   │   ├── main.py               # FastAPI 앱 진입점
│   │   ├── routes/
│   │   │   └── ocr_routes.py     # /api/ocr/upload 엔드포인트
│   │   ├── services/
│   │   │   ├── ocr_service.py    # Upstage OCR API 호출
│   │   │   ├── masking_service.py# 민감정보 감지 및 마스킹
│   │   │   ├── image_service.py  # 이미지 로드/처리
│   │   │   ├── document_service.py # 문서 분류 (처방전 등)
│   │   │   └── medicine_service.py # 약품명/복용 메모 추출
│   │   ├── models/
│   │   │   └── response_model.py # API 응답 스키마 (Pydantic)
│   │   └── utils/
│   │       ├── file_utils.py     # 파일 관련 유틸
│   │       └── regex_patterns.py # 민감정보 정규식 패턴
│   └── tests/                    # 단독 실행 테스트 스크립트
│       ├── ocr_test.py
│       ├── mask_test.py
│       └── scan_test.py
│
├── frontend/                     # React Native (Expo) 앱
│   ├── App.js                    # 네비게이션 루트
│   ├── index.js                  # Expo 진입점
│   ├── app.json                  # Expo 앱 설정
│   ├── babel.config.js
│   ├── package.json              # npm 패키지 목록
│   └── src/
│       ├── config.js             # 백엔드 서버 IP 설정
│       ├── screens/
│       │   ├── CameraScreen.js   # 카메라 촬영 화면
│       │   └── ResultScreen.js   # OCR 결과 표시 화면
│       ├── components/
│       │   └── CameraGuideOverlay.js # 촬영 가이드 UI
│       └── services/
│           └── api.js            # 백엔드 API 호출 함수
│
└── OCR/                          # 초기 OCR 실험용 스크립트 (참고용)
    ├── ocr_test.py
    ├── mask_test.py
    ├── scan_test.py
    └── images/
        └── sample.png
```

---

## 사전 준비

- **Python** 3.10 이상
- **Node.js** 18 이상 + npm
- **Expo Go 앱** (테스트할 실기기에 설치)
- **Upstage API 키** (https://console.upstage.ai 에서 발급)

---

## 1. 백엔드 설정 및 실행

### 1-1. 환경변수 설정

`backend/` 폴더 안에 `.env` 파일을 생성합니다.
`.env.example`을 복사해서 만들면 됩니다.

```bash
cp backend/.env.example backend/.env
```

`.env` 파일을 열어 API 키를 입력합니다:

```
UPSTAGE_API_KEY=your_upstage_api_key_here
UPLOAD_DIR=uploads
OUTPUT_DIR=output
```

### 1-2. 가상환경 생성 및 패키지 설치

```bash
cd backend
python -m venv venv
```

**Windows:**
```bash
venv\Scripts\activate
```

**Mac / Linux:**
```bash
source venv/bin/activate
```

패키지 설치:
```bash
pip install -r requirements.txt
```

### 1-3. 서버 실행

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- 서버가 정상 실행되면 `http://localhost:8000` 으로 접속 가능
- API 문서(Swagger): `http://localhost:8000/docs`
- 헬스 체크: `http://localhost:8000/api/ocr/health`

> `--host 0.0.0.0` 옵션은 같은 와이파이에 있는 실기기(폰)에서 접속하기 위해 필요합니다.

---

## 2. 프론트엔드 설정 및 실행

### 2-1. 패키지 설치

```bash
cd frontend
npm install
```

### 2-2. 백엔드 서버 IP 설정

`frontend/src/config.js` 파일을 열어 IP 주소를 수정합니다.

```js
// 실제 기기 테스트 시: 컴퓨터의 로컬 IP 주소로 변경
export const API_BASE_URL = 'http://192.168.x.x:8000';

// Android 에뮬레이터 사용 시:
// export const API_BASE_URL = 'http://10.0.2.2:8000';

// iOS 시뮬레이터 사용 시:
// export const API_BASE_URL = 'http://localhost:8000';
```

> 컴퓨터 IP 확인 방법:
> - Windows: 터미널에서 `ipconfig` 실행 후 "IPv4 주소" 확인
> - Mac/Linux: `ifconfig` 또는 `ip addr` 실행

### 2-3. 앱 실행

```bash
npx expo start
```

실행 후 터미널에 QR 코드가 표시됩니다.
스마트폰에서 **Expo Go 앱**을 열고 QR 코드를 스캔하면 앱이 실행됩니다.

---

## 3. 실행 순서 요약

```
1. backend/.env 파일에 API 키 입력
2. 백엔드 서버 실행 (uvicorn)
3. frontend/src/config.js 에 컴퓨터 IP 입력
4. 프론트엔드 실행 (npx expo start)
5. 폰에서 Expo Go로 QR 스캔
```

---

## 4. API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/ocr/upload` | 이미지 업로드 → OCR + 마스킹 처리 |
| GET | `/api/ocr/health` | 서버 상태 확인 |
| GET | `/output/{filename}` | 마스킹된 이미지 파일 조회 |

---

## 주의사항

- `.env` 파일은 절대 git에 올리지 않습니다. (`.gitignore`에 포함됨)
- 서버 실행 시 `uploads/`, `output/` 폴더 안의 이전 파일이 자동 삭제됩니다.
- 백엔드와 프론트엔드가 **같은 와이파이**에 연결되어 있어야 실기기 테스트가 가능합니다.
