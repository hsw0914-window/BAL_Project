# BabyAutoLog (BAL)

영수증·진료기록·메모를 사진 한 장으로 OCR + AI 분류해서 자동 기록해주는 육아 앱.
- **Backend**: FastAPI + SQLite + Anthropic Claude (분류/요약) + Upstage OCR
- **Frontend**: Expo (React Native) — 폰에서 Expo Go 로 바로 테스트 가능

---

## 0. 사전 준비

| 도구 | 용도 | 설치 |
| --- | --- | --- |
| Python 3.10+ | 백엔드 | https://www.python.org |
| Node.js 18+ | 프론트엔드 | https://nodejs.org |
| Expo Go (앱) | 폰 미리보기 | App Store / Play Store |

API 키 두 개 필요:
- **Anthropic API Key** — https://console.anthropic.com/settings/keys (`sk-ant-...`)
- **Upstage API Key** — https://console.upstage.ai/api-keys (`up_...`)

---

## 1. Backend 실행

```bash
cd backend

# 가상환경 (최초 1회)
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 환경변수 — backend/.env 파일 만들고 키 채우기
ANTHROPIC_API_KEY=sk-ant-...여기에 본인 키...
UPSTAGE_API_KEY=up_...여기에 본인 키...
UPLOAD_DIR=uploads
OUTPUT_DIR=output

# 서버 시작
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

확인:
- Swagger UI: http://localhost:8000/docs
- 헬스체크: http://localhost:8000/

---

## 2. Frontend 실행

### 2-1. 백엔드 주소 설정

`frontend/src/config.js` 의 `API_BASE_URL` 을 자기 환경에 맞게 수정:

```js
// 폰(Expo Go)에서 테스트 → 컴퓨터의 LAN IP
export const API_BASE_URL = 'http://192.168.x.x:8000';

// Android 에뮬레이터
// export const API_BASE_URL = 'http://10.0.2.2:8000';

// iOS 시뮬레이터 / 웹 프리뷰
// export const API_BASE_URL = 'http://localhost:8000';
```

LAN IP 확인:
- macOS/Linux: `ifconfig | grep "inet "` 또는 `hostname -I`
- Windows: `ipconfig` 의 "IPv4 주소"

### 2-2. Expo 시작

```bash
cd frontend
npm install                        # 최초 1회
npx expo start --host lan --port 8081
```

터미널에 QR 코드와 `exp://<IP>:8081` 주소가 뜸.

### 2-3. 폰에서 테스트

1. 폰에 **Expo Go** 앱 설치
2. **컴퓨터와 폰을 동일 Wi-Fi 에 연결**
3. Expo Go 앱에서 QR 스캔 (또는 `exp://<IP>:8081` 직접 입력)
4. 번들 다운로드 후 앱 실행

---

## 3. 자주 쓰는 동작

- 다크모드 토글: 홈 화면 우상단 토글
- 설정 (수유 알림 / 간격): 홈 우상단 톱니바퀴
- 아기 정보 등록: 좌상단 로고/이름 영역 탭
- 기록 추가: 하단탭 가운데 + 버튼 → 사진/텍스트 선택 → AI 자동 분류
- 검색: 기록 화면 우상단 돋보기

---

## 4. 트러블슈팅

| 증상 | 해결 |
| --- | --- |
| 폰에서 "Network request failed" | `API_BASE_URL` 의 LAN IP 가 정확한지 + 둘 다 같은 Wi-Fi 인지 확인 |
| 앱이 빈 화면 | Expo Go 종료 후 재시작 → 캐시 초기화 (`npx expo start --clear`) |
| "ANTHROPIC_API_KEY missing" | `backend/.env` 가 `backend/` 폴더 안에 있는지 + 키 끝에 공백 없는지 |
| Upstage OCR 401 | 키 앞에 `up_` 가 포함됐는지 (전체 토큰 그대로 붙여넣기) |
| SQLite 락 에러 | `backend/baby_records.db` 사용 중 → 서버 재시작 |

---

## 5. 프로젝트 구조

```
BAL_Project/
├── main.py
├── app/
│   ├── core/         # 설정, DB, 보안
│   ├── models/       # DB 테이블 정의
│   │   ├── __init__.py
│   │   ├── models.py           # 기본 테이블 (User, Baby, Record 등)
│   │   └── category_models.py  # 카테고리별 상세 기록 테이블
│   ├── routers/      # API 엔드포인트
│   ├── schemas/      # 요청/응답 형식
│   └── services/     # AI 분류/마스킹 로직
│       ├── anthropic_service.py
│       └── upstage_service.py
└── frontend/
    └── src/
        ├── screens/
        ├── components/
        ├── services/api.js
        ├── theme.js
        └── config.js
```

---

## 6. 주요 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/v1/auth/register | 회원가입 |
| POST | /api/v1/auth/login | 로그인 |
| POST | /api/v1/babies | 아이 등록 |
| POST | /api/v1/records | 육아 기록 저장 |
| GET | /api/v1/records | 기록 목록 조회 |
| GET | /api/v1/reports/{baby_id} | 기간별 리포트 |
| POST | /api/v1/documents | OCR 문서 저장 |
| GET | /api/v1/documents | OCR 문서 목록 조회 |
| GET | /api/v1/documents/{id} | OCR 문서 상세 조회 |
| PATCH | /api/v1/documents/{id} | OCR 문서 수정 |
| DELETE | /api/v1/documents/{id} | OCR 문서 삭제 |

---

## 7. DB 테이블 구조

### 기본 테이블
| 테이블 | 설명 |
|--------|------|
| users | 사용자 계정 |
| babies | 아이 정보 |
| records | 육아 기록 |
| masked_info | 마스킹된 개인정보 |

### OCR 테이블
| 테이블 | 설명 |
|--------|------|
| documents | OCR 문서 공통 정보 |
| prescription_details | 처방전 상세 |
| prescription_medicines | 처방약 목록 |
| vaccination_details | 예방접종 상세 |
| medical_certificate_details | 진료확인서 상세 |

### 카테고리별 상세 기록 테이블
| 테이블 | 설명 |
|--------|------|
| breastfeeding_records | 모유 수유 기록 |
| formula_records | 분유 수유 기록 |
| baby_food_records | 이유식 기록 |
| diaper_records | 기저귀 기록 |
| sleep_records | 수면 기록 |
| growth_records | 성장 기록 |
| development_records | 발달 기록 |
| health_records | 건강 기록 |
| hospital_records | 병원 방문 기록 |
| daily_records | 일상 기록 |

---

## 8. 주의사항 및 보안

- CORS `allow_origins=["*"]` 는 개발용, 배포 시 도메인 명시 필요
- SECRET_KEY 배포 전 반드시 변경 (.env 에서 관리)
- 이미지 업로드 시 실제 파일 헤더로 타입 검증 필요 (python-magic)
- `/uploads` 경로 인증 없이 접근 가능 → 배포 시 별도 엔드포인트로 보호

## 9. 배포 시 체크리스트

- [ ] MySQL로 교체 (현재 SQLite는 개발용)
- [ ] SECRET_KEY 환경변수로 변경
- [ ] CORS 도메인 명시
- [ ] 이미지 업로드 검증 강화
- [ ] Alembic 마이그레이션 적용
- [ ] HTTPS 적용
