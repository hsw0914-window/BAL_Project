import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

// 가이드 박스 크기 (화면 비율)
const GUIDE_W = width * 0.82;
const GUIDE_H = height * 0.54;
const BOX_LEFT = (width - GUIDE_W) / 2;
const BOX_TOP = (height - GUIDE_H) / 2 - 30;
const CORNER = 28;      // 모서리 크기
const BORDER = 3;       // 테두리 두께

export default function CameraGuideOverlay({ isAligned, statusText, countdown }) {
  const color = isAligned ? '#00FF44' : '#FF4444';

  // 카운트다운 시 박스 깜빡임
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (countdown !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1,   duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      blinkAnim.stopAnimation();
      blinkAnim.setValue(1);
    }
  }, [countdown]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* ── 반투명 어두운 오버레이 (4방향) ── */}
      <View style={[styles.overlay, { height: BOX_TOP }]} />
      <View style={[styles.overlay, { top: BOX_TOP + GUIDE_H }]} />
      <View style={[styles.overlay, { top: BOX_TOP, height: GUIDE_H, width: BOX_LEFT }]} />
      <View style={[styles.overlay, { top: BOX_TOP, height: GUIDE_H, left: BOX_LEFT + GUIDE_W }]} />

      {/* ── 모서리 브래킷 (스캐너 스타일) ── */}
      <Animated.View style={{ opacity: blinkAnim }}>
        {/* 좌상 */}
        <Corner top={BOX_TOP}              left={BOX_LEFT}              color={color} tl />
        {/* 우상 */}
        <Corner top={BOX_TOP}              left={BOX_LEFT + GUIDE_W - CORNER} color={color} tr />
        {/* 좌하 */}
        <Corner top={BOX_TOP + GUIDE_H - CORNER} left={BOX_LEFT}              color={color} bl />
        {/* 우하 */}
        <Corner top={BOX_TOP + GUIDE_H - CORNER} left={BOX_LEFT + GUIDE_W - CORNER} color={color} br />
      </Animated.View>

      {/* ── 상태 텍스트 ── */}
      <View style={[styles.statusWrap, { top: BOX_TOP - 44 }]}>
        <Text style={[styles.statusText, { color }]}>{statusText}</Text>
      </View>

      {/* ── 카운트다운 숫자 ── */}
      {countdown !== null && (
        <View style={styles.countdownWrap}>
          <Text style={styles.countdownNum}>{countdown}</Text>
        </View>
      )}

      {/* ── 하단 힌트 ── */}
      <View style={styles.hintWrap}>
        <Text style={styles.hintText}>처방전을 가이드 안에 맞춰주세요</Text>
      </View>
    </View>
  );
}

// 모서리 하나짜리 컴포넌트
function Corner({ top, left, color, tl, tr, bl, br }) {
  return (
    <View
      style={{
        position: 'absolute',
        top, left,
        width: CORNER,
        height: CORNER,
        borderColor: color,
        borderTopWidth:    (tl || tr) ? BORDER : 0,
        borderBottomWidth: (bl || br) ? BORDER : 0,
        borderLeftWidth:   (tl || bl) ? BORDER : 0,
        borderRightWidth:  (tr || br) ? BORDER : 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  statusWrap: {
    position: 'absolute',
    left: BOX_LEFT,
    width: GUIDE_W,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  countdownWrap: {
    position: 'absolute',
    top: BOX_TOP + GUIDE_H / 2 - 40,
    left: 0, right: 0,
    alignItems: 'center',
  },
  countdownNum: {
    fontSize: 80,
    fontWeight: '900',
    color: '#00FF44',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  hintWrap: {
    position: 'absolute',
    bottom: 140,
    left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
