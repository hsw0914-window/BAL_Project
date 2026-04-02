🍼 BabyCare API
육아 기록 관리 서비스 백엔드 - React Native 연동용

📁 프로젝트 구조
BAL_Project/
├── main.py
└── app/
    ├── core/         # 설정, DB, 보안
    ├── models/       # DB 테이블 정의
    ├── routers/      # API 엔드포인트
    ├── schemas/      # 요청/응답 형식
    └── services/     # AI 분류/마스킹 로직

⚙️ 설치
bashpip install fastapi uvicorn sqlalchemy pymysql python-jose passlib bcrypt==4.0.1 pydantic-settings python-multipart "pydantic[email]"
```

> ⚠️ `bcrypt`는 반드시 `4.0.1` 버전 사용

---

## 🗄️ DB 설정

**MySQL 사용 시** `.env` 파일 작성:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=비밀번호
DB_NAME=babycare
MySQL 없이 빠르게 테스트 시 app/core/database.py 수정:
pythonengine = create_engine(
    "sqlite:///./babycare.db",
    connect_args={"check_same_thread": False},
)

▶️ 실행
bashuvicorn main:app --reload
API 문서: http://127.0.0.1:8000/docs

📌 주요 API
메서드경로설명POST/api/v1/auth/register회원가입POST/api/v1/auth/login로그인POST/api/v1/babies아이 등록POST/api/v1/records육아 기록 저장GET/api/v1/records기록 목록 조회GET/api/v1/reports/{baby_id}기간별 리포트

✅ 작동 확인 (테스트 결과)
1. 회원가입
jsonPOST /api/v1/auth/register
{
  "username": "testuser",
  "name": "홍길동",
  "email": "test@test.com",
  "nickname": "길동이",
  "password": "password123"
}
// 응답: 201 Created + access_token 발급
2. 로그인
jsonPOST /api/v1/auth/login
{
  "username": "testuser",
  "password": "password123"
}
// 응답: 200 OK + access_token 발급
3. 아이 등록
jsonPOST /api/v1/babies
Authorization: Bearer {token}
{
  "name": "민준",
  "birth_date": "2024-03-15",
  "gender": "male"
}
// 응답: 201 Created
4. 육아 기록 저장 + AI 자동 분류
jsonPOST /api/v1/records
{
  "baby_id": 3,
  "original_text": "오전 10시 분유 200ml 수유했어요",
  "record_date": "2026-04-02T10:00:00"
}
// 응답: category "feeding" 자동 분류
5. 개인정보 마스킹
jsonPOST /api/v1/records
{
  "baby_id": 3,
  "original_text": "서울아동병원 김철수 의사 진료 후 열이 38도",
  "record_date": "2026-04-02T11:00:00"
}
// 응답:
// masked_text: "**병원 **의사 진료 후 열이 38도"
// category: "health" 자동 분류
// 서울아동병원 → **병원
// 김철수 의사 → **의사

⚠️ 주의사항

models, routers, schemas, services 폴더는 반드시 app/ 안에 위치
SQLite 사용 시 main.py의 날짜를 문자열이 아닌 Python date/datetime 객체로 입력
CORS allow_origins=["*"] 는 개발용, 배포 시 도메인 명시 필요
SECRET_KEY 배포 전 반드시 변경

⚠️ 알려진 취약점 및 개선 필요 사항
🔴 보안 (배포 전 필수 수정)
1. SECRET_KEY 하드코딩
python# config.py - 현재
SECRET_KEY: str = "change-this-secret-key"

# 개선: .env에서 필수값으로 강제
SECRET_KEY: str  # 기본값 없애기
2. CORS 설정 오류
python# 현재 - 브라우저 스펙 위반 (credentials + * 동시 사용 불가)
allow_origins=["*"]
allow_credentials=True

# 개선: 도메인 명시
allow_origins=["https://mydomain.com"]
3. 이미지 업로드 보안 취약

content_type은 클라이언트가 조작 가능 → 실제 파일 헤더로 검증 필요
파일명 그대로 확장자 추출 → exploit.php.jpg 같은 공격 가능

python# 개선: python-magic으로 실제 파일 타입 검증
import magic
mime = magic.from_buffer(content, mime=True)
4. 업로드 파일 외부 노출

/uploads 경로로 누구나 직접 접근 가능
개선: 인증된 사용자만 본인 파일 접근하도록 별도 엔드포인트 필요


🟡 기능 (추후 개선 권장)
5. AI가 실제 AI가 아님

현재는 키워드 매칭 + 정규식 기반 더미 로직
추후 Claude / OpenAI API로 교체 예정 (ai_service.py 파일만 수정하면 됨)

6. 마스킹 정규식 불완전

주소/병원명 패턴이 단순해서 오탐/미탐 발생 가능
AI API 연동 시 자연스럽게 해결됨

7. 샘플 데이터 비밀번호 가짜
python# main.py - 현재 (로그인 불가)
password_hash="$2b$12$placeholder_hash_here"

# 개선
password_hash=hash_password("password123")
8. 리포트 성능 문제

기록이 많아지면 Python에서 집계하는 방식이 느려짐
개선: DB GROUP BY로 처리


🟢 배포 시 체크리스트

 MySQL로 교체 (현재 SQLite는 개발용)
 SECRET_KEY 환경변수로 변경
 CORS 도메인 명시
 이미지 업로드 검증 강화
 Alembic 마이그레이션 적용
 HTTPS 적용