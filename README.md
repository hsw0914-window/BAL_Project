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
cat > .env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...여기에 본인 키...
UPSTAGE_API_KEY=up_...여기에 본인 키...
UPLOAD_DIR=uploads
OUTPUT_DIR=output
EOF

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

## 5. 프로젝트 구조 (요약)

```
backend/
  app/
    main.py              # FastAPI 진입점
    database.py          # SQLite 스키마 (records, babies)
    routes/
      record_routes.py   # /api/records/*
      baby_routes.py     # /api/baby
      ocr_routes.py      # /api/ocr/*
    services/
      anthropic_service.py  # Claude 분류/요약
      upstage_service.py    # OCR
  .env                   # 키 (gitignored)

frontend/
  src/
    screens/             # Home / RecordList / Report / RecordInput / Result
    components/          # BrandLogo, ScreenHeader, BottomTabBar, modals…
    services/api.js      # 백엔드 호출
    theme.js             # 라이트/다크 팔레트
    config.js            # API_BASE_URL
```
