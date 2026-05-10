// 백엔드 API가 반환하는 실제 데이터 형태와 동일한 샘플 데이터
// 백엔드 연결되면 각 화면에서 import 만 떼고 진짜 API 호출로 바꾸면 됨

function dateAt(daysAgo, h, m) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  // SQLite 가 주는 형식: "YYYY-MM-DD HH:MM:SS"
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function isoDay(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ── /api/records (역시간순) ────────────────────────────
export const MOCK_RECORDS = [
  // ── 오늘 ───────────────────────────
  { id: 14, category: '분유기록',   summary: '오후 분유 120ml',
    original_text: '오후 3시 41분에 분유 120ml 먹였어',
    created_at: dateAt(0, 15, 41),
    detail: { amount_ml: 120 } },

  { id: 13, category: '기저귀기록', summary: '대변',
    original_text: '방금 대변 봤어',
    created_at: dateAt(0, 14, 10),
    detail: { type: '대변' } },

  { id: 12, category: '수면기록',   summary: '낮잠 1시간 20분',
    original_text: '12시 30분부터 낮잠 잤음',
    created_at: dateAt(0, 12, 30),
    detail: { sleep_type: '낮잠', duration_min: 80 } },

  { id: 11, category: '건강기록',   summary: '체온 37.2℃',
    original_text: '체온 37.2도 측정',
    created_at: dateAt(0, 11, 45),
    detail: { temperature: 37.2, medicine: null, symptom: null } },

  { id: 10, category: '분유기록',   summary: '오전 분유 140ml',
    original_text: '오전 분유 140ml',
    created_at: dateAt(0, 10, 55),
    detail: { amount_ml: 140 } },

  { id: 9,  category: '모유기록',   summary: '아침 모유 12분',
    original_text: '아침에 모유 12분 정도 수유',
    created_at: dateAt(0, 8, 0),
    detail: { duration_min: 12 } },

  // ── 어제 ───────────────────────────
  { id: 8,  category: '분유기록',   summary: '저녁 분유 150ml',
    original_text: '저녁 10시 15분 분유 150ml',
    created_at: dateAt(1, 22, 15),
    detail: { amount_ml: 150 } },

  { id: 7,  category: '수면기록',   summary: '야간수면 시작',
    original_text: '21시 40분 야간수면 시작',
    created_at: dateAt(1, 21, 40),
    detail: { sleep_type: '야간수면', duration_min: 540 } },

  { id: 6,  category: '기저귀기록', summary: '소변',
    original_text: '오후에 소변 봄',
    created_at: dateAt(1, 18, 30),
    detail: { type: '소변' } },

  { id: 5,  category: '이유식기록', summary: '단호박죽 50g',
    original_text: '점심으로 단호박죽 50g 잘 먹음',
    created_at: dateAt(1, 12, 0),
    detail: { food_name: '단호박죽', amount_g: 50, reaction: '잘 먹음' } },

  // ── 그저께 ─────────────────────────
  { id: 4,  category: '병원기록',   summary: '4개월 예방접종',
    original_text: '서울아동병원에서 4개월 예방접종 맞음',
    created_at: dateAt(2, 14, 30),
    detail: { hospital_name: '서울아동병원', purpose: '예방접종', prescription: null } },

  { id: 3,  category: '성장기록',   summary: '키 65cm 몸무게 7.2kg',
    original_text: '검진에서 키 65cm 몸무게 7.2kg 두위 42cm',
    created_at: dateAt(2, 14, 0),
    detail: { height_cm: 65, weight_kg: 7.2, head_cm: 42 } },

  // ── 3일 전 ─────────────────────────
  { id: 2,  category: '발달기록',   summary: '뒤집기 첫 성공',
    original_text: '오늘 처음으로 뒤집기 성공!',
    created_at: dateAt(3, 16, 0),
    detail: { milestone: '뒤집기 성공' } },

  { id: 1,  category: '일상기록',   summary: '할머니 댁 방문',
    original_text: '할머니 댁 방문, 너무 좋아함',
    created_at: dateAt(3, 11, 0),
    detail: { memo: '할머니 댁 방문, 좋아함' } },
];

// ── /api/stats/summary?days=7 ───────────────────────────
export const MOCK_SUMMARY = {
  total_records: 14,
  diaper_count: 5,
  hospital_count: 1,
  health_count: 1,
};

// ── /api/stats/feeding?days=7 ───────────────────────────
export const MOCK_FEEDING = {
  formula: [
    { date: isoDay(6), amount_ml: 580, count: 4 },
    { date: isoDay(5), amount_ml: 620, count: 5 },
    { date: isoDay(4), amount_ml: 720, count: 6 },
    { date: isoDay(3), amount_ml: 680, count: 5 },
    { date: isoDay(2), amount_ml: 700, count: 5 },
    { date: isoDay(1), amount_ml: 650, count: 5 },
    { date: isoDay(0), amount_ml: 260, count: 2 },
  ],
  breastfeeding: [
    { date: isoDay(6), duration_min: 40, count: 3 },
    { date: isoDay(5), duration_min: 35, count: 2 },
    { date: isoDay(4), duration_min: 50, count: 3 },
    { date: isoDay(3), duration_min: 45, count: 3 },
    { date: isoDay(2), duration_min: 30, count: 2 },
    { date: isoDay(1), duration_min: 50, count: 3 },
    { date: isoDay(0), duration_min: 12, count: 1 },
  ],
};

// ── /api/stats/sleep?days=7 ─────────────────────────────
export const MOCK_SLEEP = [
  { date: isoDay(6), sleep_type: '낮잠',     duration_min: 120 },
  { date: isoDay(6), sleep_type: '야간수면', duration_min: 560 },
  { date: isoDay(5), sleep_type: '낮잠',     duration_min: 100 },
  { date: isoDay(5), sleep_type: '야간수면', duration_min: 580 },
  { date: isoDay(4), sleep_type: '낮잠',     duration_min: 140 },
  { date: isoDay(4), sleep_type: '야간수면', duration_min: 540 },
  { date: isoDay(3), sleep_type: '낮잠',     duration_min: 110 },
  { date: isoDay(3), sleep_type: '야간수면', duration_min: 570 },
  { date: isoDay(2), sleep_type: '낮잠',     duration_min: 130 },
  { date: isoDay(2), sleep_type: '야간수면', duration_min: 550 },
  { date: isoDay(1), sleep_type: '낮잠',     duration_min: 100 },
  { date: isoDay(1), sleep_type: '야간수면', duration_min: 590 },
  { date: isoDay(0), sleep_type: '낮잠',     duration_min: 80  },
];

// ── /api/stats/growth (전체) ────────────────────────────
export const MOCK_GROWTH = [
  { date: '2026-01-15', height_cm: 56,   weight_kg: 4.5, head_cm: 38   },
  { date: '2026-02-12', height_cm: 59,   weight_kg: 5.4, head_cm: 39.5 },
  { date: '2026-03-10', height_cm: 62,   weight_kg: 6.3, head_cm: 41   },
  { date: '2026-04-08', height_cm: 64,   weight_kg: 6.8, head_cm: 42   },
  { date: '2026-05-08', height_cm: 65,   weight_kg: 7.2, head_cm: 42.5 },
];

// /api/stats/summary 30일치 — 월간 토글용
export const MOCK_SUMMARY_30 = {
  total_records: 58,
  diaper_count: 22,
  hospital_count: 2,
  health_count: 3,
};
