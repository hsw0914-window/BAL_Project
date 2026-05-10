// records 배열에서 화면 표시용 데이터를 파생하는 헬퍼들.
// 백엔드 연결되면 records 만 GET /api/records 결과로 교체하면 됨 (shape 동일).

// ── SQLite UTC datetime → 로컬 Date 객체 ──────────────
// SQLite "YYYY-MM-DD HH:MM:SS" 는 UTC. JS는 그 형태를 로컬로 파싱하므로 명시적으로 UTC 변환.
export function parseUTC(s) {
  if (!s) return new Date(NaN);
  if (s instanceof Date) return s;
  // 이미 ISO + Z/오프셋 있으면 그대로
  if (/T.*(Z|[+-]\d{2}:?\d{2})$/.test(s)) return new Date(s);
  // "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SSZ" 로 보정
  return new Date(s.replace(' ', 'T') + 'Z');
}

// ── 날짜 비교 ─────────────────────────────────────────
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth()    === b.getMonth()
    && a.getDate()     === b.getDate();
}

// scope: 'today' | 'yesterday' | 'week'
export function scopeFilter(records, scope) {
  const now = new Date();
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
  const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 6); weekAgo.setHours(0, 0, 0, 0);

  return records.filter((r) => {
    const d = parseUTC(r.created_at);
    if (scope === 'today')     return isSameDay(d, now);
    if (scope === 'yesterday') return isSameDay(d, yesterday);
    if (scope === 'week')      return d >= weekAgo && d <= now;
    return true;
  });
}

// ── 마지막 수유 (분유 + 모유 중 가장 최근) ───────────────
export function getLastFeeding(records) {
  return records.find(
    (r) => r.category === '분유기록' || r.category === '모유기록'
  ) || null;
}

// ── 시간 차이 → "X시간 X분 전" 형태 객체 ──────────────
export function formatTimeAgo(isoStr) {
  const diffMs = Date.now() - parseUTC(isoStr).getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes, totalMinutes };
}

// "13:27" 형태 (로컬 시각)
export function formatHHMM(isoStr) {
  const d = parseUTC(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 생년월일 → "생후 N일"
export function formatBabyAge(birthDateStr) {
  if (!birthDateStr) return '';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '';
  birth.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.floor((now - birth) / 86400000);
  if (days < 0) return '';
  if (days < 30) return `생후 ${days}일`;
  const months = Math.floor(days / 30);
  if (months < 24) return `생후 ${months}개월`;
  const years = Math.floor(months / 12);
  return `${years}살`;
}

// 분 → "3시간 40분" 형태
export function formatDuration(min) {
  if (min == null) return '-';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// ── 통계 요약 ─────────────────────────────────────────
export function summarizeStats(records) {
  const formula = records.filter((r) => r.category === '분유기록');
  const breast  = records.filter((r) => r.category === '모유기록');
  const sleep   = records.filter((r) => r.category === '수면기록');
  const diaper  = records.filter((r) => r.category === '기저귀기록');

  const formulaMl  = formula.reduce((s, r) => s + (r.detail?.amount_ml || 0), 0);
  const breastMin  = breast .reduce((s, r) => s + (r.detail?.duration_min || 0), 0);
  const sleepMin   = sleep  .reduce((s, r) => s + (r.detail?.duration_min || 0), 0);

  let napCount = 0, nightCount = 0;
  sleep.forEach((r) => {
    if (r.detail?.sleep_type === '낮잠') napCount++;
    else if (r.detail?.sleep_type === '야간수면') nightCount++;
  });

  let so = 0, dae = 0;
  diaper.forEach((r) => {
    const t = r.detail?.type || '';
    if (t.includes('소변')) so++;
    if (t.includes('대변')) dae++;
  });

  return {
    total: records.length,
    formula: {
      total_ml: formulaMl,
      count: formula.length,
      avg_ml: formula.length ? Math.round(formulaMl / formula.length) : 0,
    },
    breastfeeding: {
      total_min: breastMin,
      count: breast.length,
    },
    sleep: {
      total_min: sleepMin,
      count: sleep.length,
      nap_count: napCount,
      night_count: nightCount,
    },
    diaper: {
      total: diaper.length,
      so, dae,
    },
  };
}

// ── 카테고리 → 화면용 작은 아이콘 (HomeScreen 최근 기록 row) ──
export const RECENT_ICON_MAP = {
  '분유기록':   'water-outline',
  '모유기록':   'heart-outline',
  '이유식기록': 'restaurant-outline',
  '기저귀기록': 'leaf-outline',
  '수면기록':   'moon-outline',
  '성장기록':   'resize-outline',
  '발달기록':   'sparkles-outline',
  '건강기록':   'thermometer-outline',
  '병원기록':   'medkit-outline',
  '일상기록':   'reader-outline',
};

// 카테고리별 row tail 한 줄 ("8분 소요" / "정상" / "깊음" 같은 보조 문구)
export function buildRowTail(record) {
  const d = record.detail || {};
  switch (record.category) {
    case '분유기록':   return d.amount_ml != null ? `${d.amount_ml}ml` : '';
    case '모유기록':   return d.duration_min != null ? `${d.duration_min}분` : '';
    case '수면기록':   return d.sleep_type || '';
    case '기저귀기록': return d.type || '';
    case '건강기록':   return d.temperature != null ? `${d.temperature}℃` : (d.symptom || '');
    case '이유식기록': return d.reaction || (d.amount_g != null ? `${d.amount_g}g` : '');
    case '병원기록':   return d.purpose || '';
    case '발달기록':   return '이정표';
    case '성장기록':   return d.weight_kg != null ? `${d.weight_kg}kg` : '';
    case '일상기록':   return '메모';
    default: return '';
  }
}

// 최근 기록 row 첫 줄 텍스트 — "분유 120ml" 같은 형태
export function buildRowMain(record) {
  const d = record.detail || {};
  switch (record.category) {
    case '분유기록':   return `분유 ${d.amount_ml ?? '?'}ml`;
    case '모유기록':   return `모유 ${d.duration_min ?? '?'}분`;
    case '수면기록':   return `${d.sleep_type || '수면'} ${d.duration_min != null ? formatDuration(d.duration_min) : ''}`.trim();
    case '기저귀기록': return `기저귀 · ${d.type || '?'}`;
    case '건강기록':   return d.temperature != null ? `체온 ${d.temperature}℃` : (record.summary || '건강');
    case '이유식기록': return `${d.food_name || '이유식'}${d.amount_g != null ? ` ${d.amount_g}g` : ''}`;
    case '병원기록':   return d.hospital_name || record.summary || '병원';
    case '발달기록':   return d.milestone || record.summary || '발달';
    case '성장기록':   return record.summary || '성장';
    case '일상기록':   return d.memo || record.summary || '메모';
    default: return record.summary || record.category;
  }
}
