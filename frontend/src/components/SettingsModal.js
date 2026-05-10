import { useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const INTERVAL_OPTIONS = [
  { value: 90,  label: '1.5시간' },
  { value: 120, label: '2시간' },
  { value: 180, label: '3시간' },
  { value: 240, label: '4시간' },
];

const APP_VERSION = '1.0.0';

export default function SettingsModal({
  visible,
  onClose,
  alarmsOn,
  onToggleAlarms,
  alarmThreshold,
  onChangeThreshold,
  onOpenBabyProfile,
  babyName,
}) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headRow}>
            <Text style={styles.title}>설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={C.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* 알림 섹션 */}
            <Text style={styles.sectionLabel}>알림</Text>

            <Row
              styles={styles}
              icon="notifications-outline"
              title="수유 알림"
              subtitle={alarmsOn ? '"곧 수유" 표시 활성화' : '꺼짐'}
              right={
                <SwitchPill
                  styles={styles}
                  on={alarmsOn}
                  onPress={onToggleAlarms}
                />
              }
            />

            <Text style={styles.subLabel}>수유 간격</Text>
            <View style={styles.segRow}>
              {INTERVAL_OPTIONS.map((opt) => {
                const active = opt.value === alarmThreshold;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onChangeThreshold(opt.value)}
                    style={[styles.seg, active && styles.segActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segText, active && styles.segTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>
              마지막 수유로부터 이 시간 지나면 "곧 수유" 표시가 떠요
            </Text>

            {/* 프로필 섹션 */}
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>프로필</Text>
            <TouchableOpacity
              onPress={() => { onClose(); setTimeout(onOpenBabyProfile, 200); }}
              activeOpacity={0.7}
            >
              <Row
                styles={styles}
                icon="happy-outline"
                title="아기 정보"
                subtitle={babyName || '미설정 — 탭해서 입력하기'}
                right={
                  <Ionicons name="chevron-forward" size={18} color={C.inkMute} />
                }
              />
            </TouchableOpacity>

            {/* 앱 정보 섹션 */}
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>앱 정보</Text>
            <Row
              styles={styles}
              icon="information-circle-outline"
              title="BabyAutoLog"
              subtitle={`버전 ${APP_VERSION}`}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Row({ styles, icon, title, subtitle, right }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={styles._inkColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

function SwitchPill({ styles, on, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={6}>
      <View style={[styles.switchTrack, on && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, on && styles.switchThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (C) => {
  const styles = StyleSheet.create({
    overlay: {
      flex: 1, backgroundColor: 'rgba(20,19,17,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: C.bg,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8,
      maxHeight: '80%',
    },
    handle: {
      alignSelf: 'center', width: 40, height: 4,
      borderRadius: 2, backgroundColor: C.border, marginBottom: 14,
    },
    headRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 12,
    },
    title: { fontSize: 18, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },

    body: { paddingTop: 4, paddingBottom: 16 },

    sectionLabel: {
      fontSize: 11, color: C.inkSoft, fontWeight: '800',
      letterSpacing: 0.6, marginBottom: 8,
      textTransform: 'uppercase',
    },
    subLabel: {
      fontSize: 12, color: C.inkSoft, fontWeight: '700',
      marginTop: 16, marginBottom: 8,
    },
    helperText: {
      fontSize: 11, color: C.inkMute, marginTop: 8, fontStyle: 'italic',
    },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 14,
      paddingVertical: 12, paddingHorizontal: 14,
      borderWidth: 1, borderColor: C.border,
      marginBottom: 8,
    },
    rowIcon: {
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: C.cardSoft,
      alignItems: 'center', justifyContent: 'center',
    },
    rowTitle: { fontSize: 14, fontWeight: '800', color: C.ink },
    rowSub: { fontSize: 11, color: C.inkSoft, marginTop: 2, fontWeight: '500' },

    // segmented (수유 간격)
    segRow: { flexDirection: 'row', gap: 6 },
    seg: {
      flex: 1, paddingVertical: 10,
      borderRadius: 10, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.card,
      alignItems: 'center',
    },
    segActive: { backgroundColor: C.ink, borderColor: C.ink },
    segText: { fontSize: 12, color: C.ink, fontWeight: '700' },
    segTextActive: { color: C.bg, fontWeight: '800' },

    // switch
    switchTrack: {
      width: 42, height: 24, borderRadius: 12,
      backgroundColor: C.border,
      justifyContent: 'center', paddingHorizontal: 2,
    },
    switchTrackOn: { backgroundColor: C.forest },
    switchThumb: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: C.bg,
    },
    switchThumbOn: { transform: [{ translateX: 18 }] },
  });
  // Row 컴포넌트가 ink 색을 직접 받기 위해 styles 객체에 첨부
  styles._inkColor = C.ink;
  return styles;
};
