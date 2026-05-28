import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import CameraGuideOverlay from '../components/CameraGuideOverlay';
import { uploadDocument } from '../services/api';

// 흔들림 감지 임계값 (작을수록 민감)
const STABILITY_THRESHOLD = 0.07;
// 이 시간(ms) 동안 안정적이면 카운트다운 시작
const STABLE_DELAY_MS = 1000;
// 카운트다운 초
const COUNTDOWN_SEC = 3;

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isAligned, setIsAligned]     = useState(false);
  const [countdown, setCountdown]     = useState(null);  // null | 3 | 2 | 1
  const [isUploading, setIsUploading] = useState(false);

  const lastAccel     = useRef({ x: 0, y: 0, z: 0 });
  const stableTimer   = useRef(null);
  const countdownTimer = useRef(null);
  const captureGuard  = useRef(false);  // 중복 촬영 방지

  // ── 가속도 센서로 흔들림 감지 ──────────────────────────
  useEffect(() => {
    Accelerometer.setUpdateInterval(120);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const delta =
        Math.abs(x - lastAccel.current.x) +
        Math.abs(y - lastAccel.current.y) +
        Math.abs(z - lastAccel.current.z);
      lastAccel.current = { x, y, z };

      if (delta < STABILITY_THRESHOLD) {
        // 안정 → STABLE_DELAY_MS 후 카운트다운 시작
        if (!stableTimer.current && !captureGuard.current) {
          stableTimer.current = setTimeout(() => {
            setIsAligned(true);
            startCountdown();
          }, STABLE_DELAY_MS);
        }
      } else {
        // 흔들림 → 타이머 리셋
        resetTimers();
        setIsAligned(false);
        setCountdown(null);
      }
    });

    return () => {
      sub.remove();
      resetTimers();
    };
  }, []);

  function resetTimers() {
    clearTimeout(stableTimer.current);
    stableTimer.current = null;
    clearInterval(countdownTimer.current);
    countdownTimer.current = null;
  }

  function startCountdown() {
    let sec = COUNTDOWN_SEC;
    setCountdown(sec);
    countdownTimer.current = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        clearInterval(countdownTimer.current);
        setCountdown(null);
        captureAndUpload();
      } else {
        setCountdown(sec);
      }
    }, 1000);
  }

  // ── 촬영 → 업로드 ──────────────────────────────────────
  async function captureAndUpload() {
    if (captureGuard.current || !cameraRef.current) return;
    captureGuard.current = true;
    resetTimers();

    try {
      // 촬영
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });

      setIsUploading(true);

      // 백엔드 업로드 (원본은 여기서만 전송, 로컬 저장 없음)
      const result = await uploadDocument(photo.uri);

      setIsUploading(false);
      navigation.navigate('Result', { result });
    } catch (err) {
      setIsUploading(false);
      captureGuard.current = false;
      setIsAligned(false);
      setCountdown(null);

      const msg =
        err.response?.data?.detail ||
        err.message ||
        '처리 중 오류가 발생했습니다.';
      Alert.alert('오류', msg, [{ text: '확인' }]);
    }
  }

  // ── 권한 처리 ────────────────────────────────────────
  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>권한 허용</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── 상태 텍스트 결정 ──────────────────────────────────
  const statusText = isUploading
    ? '분석 중...'
    : countdown !== null
    ? `${countdown}초 후 자동 촬영`
    : isAligned
    ? '문서가 감지됐습니다'
    : '가이드 안에 문서를 맞춰주세요';

  return (
    <View style={styles.container}>
      {/* 카메라 프리뷰 */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* 가이드 오버레이 */}
      <CameraGuideOverlay
        isAligned={isAligned}
        statusText={statusText}
        countdown={countdown}
      />

      {/* 업로드 중 스피너 */}
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>처방전 분석 중...</Text>
          <Text style={styles.loadingSubText}>민감정보를 마스킹하고 있습니다</Text>
        </View>
      )}

      {/* 수동 촬영 버튼 */}
      {!isUploading && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => {
              resetTimers();
              captureAndUpload();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  center: {
    flex: 1, backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  permText: { color: '#fff', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  permBtn: {
    backgroundColor: '#3B82F6', paddingVertical: 12,
    paddingHorizontal: 32, borderRadius: 10,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText:    { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 },
  loadingSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 130, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff',
  },
});
