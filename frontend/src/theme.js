import React, { createContext, useContext, useMemo, useState } from 'react';

// ── LIGHT (크림 베이지) ─────────────────────────────
export const LIGHT = {
  bg: '#F4EEDF',
  card: '#FFFDF6',
  cardSoft: '#F8F2E2',
  border: '#E5DBC2',
  borderSoft: '#EFE6CE',

  ink: '#141311',
  inkSoft: '#5A5343',
  inkMute: '#A29B85',

  mintBg: '#C5E0CC',
  mintInk: '#1B4A30',
  forest: '#2D5C42',
  forestInk: '#FFFDF6',

  amberBg: '#F5E0A1',
  amberInk: '#7A5C00',

  roseBg: '#F5C8C0',
  roseInk: '#7A1F12',

  avatarBg: '#FCE9A6',
};

// ── DARK (산모 야간모드 — 따뜻한 차콜 + 골드 / 민트 액센트) ─────
export const DARK = {
  bg: '#0C0D11',           // 더 깊은 차콜 (Linear/Notion 톤)
  card: '#16171D',         // 카드: 따뜻한 다크 — 살짝 갈색끼
  cardSoft: '#101116',
  border: '#2A2530',       // 따뜻한 보더 (라이트의 cream-beige 보더 페어링)
  borderSoft: '#1F1C25',

  ink: '#F0E6D0',          // 라이트 모드 cream과 짝맞춘 따뜻한 오프화이트
  inkSoft: '#B5A993',
  inkMute: '#6B6354',

  // 강한 골드/민트 액센트 — 야간에도 또렷이 보이고 눈 안 자극
  mintBg: '#1E4636',       // 깊은 emerald
  mintInk: '#7DD3A7',      // 밝은 mint accent
  forest: '#3D7A57',       // brighter forest
  forestInk: '#F0E6D0',

  amberBg: '#3D2D10',      // 깊은 amber
  amberInk: '#F0C97D',     // 골드

  roseBg: '#3D1E1A',
  roseInk: '#E5A199',

  avatarBg: '#5C4117',     // 따뜻한 골드 amber (라이트의 yellow와 페어)
};

// ── 카테고리 색 (테마별로 분기) ────────────────────────
export const CATEGORY_COLORS_LIGHT = {
  '모유기록':   { bg: '#F2E0E2', ink: '#6E2A33' },
  '분유기록':   { bg: '#E8DDC2', ink: '#5C4520' },
  '이유식기록': { bg: '#EBE4C2', ink: '#4F4514' },
  '기저귀기록': { bg: '#D8E3CB', ink: '#33502B' },
  '수면기록':   { bg: '#D4DDE7', ink: '#1F3A52' },
  '성장기록':   { bg: '#DDD4E2', ink: '#3F2E55' },
  '발달기록':   { bg: '#F0D7D5', ink: '#6E2925' },
  '건강기록':   { bg: '#EAC9C5', ink: '#6B1E18' },
  '병원기록':   { bg: '#C9DED2', ink: '#1F4D38' },
  '일상기록':   { bg: '#E2DDCF', ink: '#48402F' },
};

export const CATEGORY_COLORS_DARK = {
  '모유기록':   { bg: '#3D252A', ink: '#F0B8C2' },   // 핑크
  '분유기록':   { bg: '#3D2F14', ink: '#F0C97D' },   // 골드
  '이유식기록': { bg: '#3D3110', ink: '#E8D080' },   // 머스타드
  '기저귀기록': { bg: '#2A3A23', ink: '#A8DBA0' },   // 라임
  '수면기록':   { bg: '#1F2D40', ink: '#A8C9E5' },   // 인디고
  '성장기록':   { bg: '#2A2335', ink: '#C8B5E5' },   // 라벤더
  '발달기록':   { bg: '#3D2520', ink: '#E8B0A8' },   // 코랄
  '건강기록':   { bg: '#401C1A', ink: '#E89A8E' },   // 주홍
  '병원기록':   { bg: '#1F3528', ink: '#A8DCC0' },   // 에메랄드
  '일상기록':   { bg: '#2E2820', ink: '#D0C5A0' },   // 샌드
};

export const CATEGORY_ICONS = {
  '모유기록':   'heart-outline',
  '분유기록':   'water-outline',
  '이유식기록': 'restaurant-outline',
  '기저귀기록': 'leaf-outline',
  '수면기록':   'moon-outline',
  '성장기록':   'resize-outline',
  '발달기록':   'sparkles-outline',
  '건강기록':   'thermometer-outline',
  '병원기록':   'medkit-outline',
  '일상기록':   'reader-outline',
};

// ── 테마 컨텍스트 ────────────────────────────────────
const ThemeCtx = createContext({
  C: LIGHT,
  CATEGORY_COLORS: CATEGORY_COLORS_LIGHT,
  dark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const value = useMemo(
    () => ({
      C: dark ? DARK : LIGHT,
      CATEGORY_COLORS: dark ? CATEGORY_COLORS_DARK : CATEGORY_COLORS_LIGHT,
      dark,
      toggle: () => setDark((d) => !d),
    }),
    [dark],
  );
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

// 백워드 호환 — 기존 import { C, CATEGORY_COLORS } 코드용 (라이트 기본값)
export const C = LIGHT;
export const CATEGORY_COLORS = CATEGORY_COLORS_LIGHT;
