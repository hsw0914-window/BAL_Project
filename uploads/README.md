# BabyCare React Native 연동 코드

## 파일 구조

```
App.js
src/
├── api/
│   ├── client.js      # axios 인스턴스 + 토큰 자동 첨부 + 401 자동 갱신
│   ├── auth.js        # 로그인/회원가입/로그아웃
│   ├── babies.js      # 아이 CRUD
│   ├── records.js     # 기록 CRUD + 이미지 업로드/조회
│   └── reports.js     # 기간별 리포트
├── hooks/
│   └── useAuth.js     # 로그인 상태 전역 관리 (Context)
└── screens/
    ├── LoginScreen.js         # 로그인 화면
    ├── RecordListScreen.js    # 기록 목록 (무한스크롤)
    └── RecordCreateScreen.js  # 기록 저장 (이미지 포함)
```

## 설치

```bash
npm install axios @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-image-picker
```

## 서버 주소 설정 (client.js)

| 환경 | BASE_URL |
|---|---|
| 안드로이드 에뮬레이터 | http://10.0.2.2:8000 |
| iOS 시뮬레이터 | http://localhost:8000 |
| 실기기 | http://컴퓨터IP:8000 |

## 주요 동작 설명

### 토큰 자동 갱신 (client.js)
- 모든 요청에 access_token 자동 첨부
- 401 응답 시 refresh_token으로 자동 갱신 후 재요청
- 갱신 중 동시 요청은 대기열에서 처리
- 갱신 실패 시 AsyncStorage 토큰 삭제 → 로그인 화면으로

### 이미지 조회 (records.js - fetchRecordImage)
- /uploads 직접 URL 차단됨 (수정된 서버)
- JWT 토큰 포함해서 /api/v1/records/{id}/image 로 요청
- blob 받아서 URL.createObjectURL로 처리
