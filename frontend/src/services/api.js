import axios from 'axios';
import { API_BASE_URL } from '../config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

/**
 * 촬영된 이미지를 백엔드로 업로드 → OCR + 마스킹 결과 반환
 * @param {string} imageUri - expo-camera로 촬영된 로컬 파일 URI
 * @returns {Promise<Object>} ProcessResponse 형태의 JSON
 */
export async function uploadDocument(imageUri) {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'document.jpg',
    type: 'image/jpeg',
  });

  const response = await client.post('/api/ocr/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

/**
 * 마스킹된 이미지의 전체 URL 반환
 * @param {string} path - 예: "/output/masked_abc123.png"
 */
export function getMaskedImageUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/**
 * 육아 기록 텍스트를 AI로 분류하여 저장
 * @param {string} text - 사용자가 입력한 자유 형식 텍스트
 * @returns {Promise<Array>} 저장된 기록 배열 [{id, category, summary, original_text}]
 */
export async function createRecord(text) {
  const response = await client.post('/api/records', { text });
  return response.data;
}

/**
 * 전체 기록 조회
 * @returns {Promise<Array>}
 */
export async function getRecords() {
  const response = await client.get('/api/records');
  return response.data;
}

/**
 * 카테고리별 기록 조회
 * @param {string} category
 * @returns {Promise<Array>}
 */
export async function getRecordsByCategory(category) {
  const response = await client.get(`/api/records/${encodeURIComponent(category)}`);
  return response.data;
}

/**
 * 기록 삭제
 * @param {number} id
 */
export async function deleteRecord(id) {
  const response = await client.delete(`/api/records/${id}`);
  return response.data;
}

// ── 통계 API ────────────────────────────────────

export async function getFeedingStats(days = 7) {
  const response = await client.get(`/api/stats/feeding?days=${days}`);
  return response.data;
}

export async function getSleepStats(days = 7) {
  const response = await client.get(`/api/stats/sleep?days=${days}`);
  return response.data;
}

export async function getGrowthStats() {
  const response = await client.get('/api/stats/growth');
  return response.data;
}

export async function getSummaryStats(days = 7) {
  const response = await client.get(`/api/stats/summary?days=${days}`);
  return response.data;
}

// ── Baby 프로필 ─────────────────────────────────

export async function getBaby() {
  const response = await client.get('/api/baby');
  return response.data;  // null | { id, name, gender, birth_date }
}

export async function updateBaby({ name, gender, birth_date }) {
  const response = await client.put('/api/baby', { name, gender, birth_date });
  return response.data;
}
