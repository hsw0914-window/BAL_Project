import axios from 'axios';
import { API_BASE_URL } from '../config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ── Auth token injection ────────────────────────────
let _token = null;

export function setAuthToken(token) {
  _token = token;
}

client.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

// ── Auth API ────────────────────────────────────────

export async function registerUser({ username, name, email, nickname, password }) {
  const response = await client.post('/api/auth/register', { username, name, email, nickname, password });
  return response.data;
}

export async function loginUser({ username, password }) {
  const response = await client.post('/api/auth/login', { username, password });
  return response.data;
}

export async function refreshToken(rt) {
  const response = await client.post('/api/auth/refresh', { refresh_token: rt });
  return response.data;
}

export async function getMe() {
  const response = await client.get('/api/auth/me');
  return response.data;
}

export async function loginWithGoogle(idToken) {
  const response = await client.post('/api/auth/google', { id_token: idToken });
  return response.data;
}

export async function googleDeviceInit() {
  const response = await client.post('/api/auth/google/device-init');
  return response.data;
}

export async function googleDevicePoll(deviceCode) {
  const response = await client.post('/api/auth/google/device-poll', { device_code: deviceCode });
  return response.data;
}


// ── OCR ─────────────────────────────────────────────

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

export function getMaskedImageUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// ── Records ─────────────────────────────────────────

export async function createRecord(text, babyId) {
  const body = { text };
  if (babyId) body.baby_id = babyId;
  const response = await client.post('/api/records', body);
  return response.data;
}

export async function getRecords(babyId) {
  const params = babyId ? { baby_id: babyId } : {};
  const response = await client.get('/api/records', { params });
  return response.data;
}

export async function getRecordsByCategory(category, babyId) {
  const params = babyId ? { baby_id: babyId } : {};
  const response = await client.get(`/api/records/${encodeURIComponent(category)}`, { params });
  return response.data;
}

export async function deleteRecord(id) {
  const response = await client.delete(`/api/records/${id}`);
  return response.data;
}

// ── Stats ───────────────────────────────────────────

export async function getFeedingStats(days = 7, babyId) {
  const params = { days };
  if (babyId) params.baby_id = babyId;
  const response = await client.get('/api/stats/feeding', { params });
  return response.data;
}

export async function getSleepStats(days = 7, babyId) {
  const params = { days };
  if (babyId) params.baby_id = babyId;
  const response = await client.get('/api/stats/sleep', { params });
  return response.data;
}

export async function getGrowthStats(babyId) {
  const params = babyId ? { baby_id: babyId } : {};
  const response = await client.get('/api/stats/growth', { params });
  return response.data;
}

export async function getSummaryStats(days = 7, babyId) {
  const params = { days };
  if (babyId) params.baby_id = babyId;
  const response = await client.get('/api/stats/summary', { params });
  return response.data;
}

// ── Babies (multi-baby) ─────────────────────────────

export async function getBabies() {
  const response = await client.get('/api/babies');
  return response.data;
}

export async function createBaby({ name, gender, birth_date }) {
  const response = await client.post('/api/babies', { name, gender, birth_date });
  return response.data;
}

export async function updateBaby(babyId, { name, gender, birth_date }) {
  const response = await client.put(`/api/babies/${babyId}`, { name, gender, birth_date });
  return response.data;
}

export async function deleteBaby(babyId) {
  const response = await client.delete(`/api/babies/${babyId}`);
  return response.data;
}
