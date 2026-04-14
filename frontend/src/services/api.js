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
