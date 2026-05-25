import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import BottomTabBar from '../components/BottomTabBar';
import BabyProfileModal from '../components/BabyProfileModal';
import SettingsModal from '../components/SettingsModal';
import DarkModeToggle from '../components/DarkModeToggle';
import BrandLogo from '../components/BrandLogo';

const SERIF_ITALIC = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
import { MOCK_RECORDS } from '../mockData';
import { getRecords } from '../services/api';
import { useAuth } from '../AuthContext';
import { useBaby } from '../BabyContext';
import BabySelectorModal from '../components/BabySelectorModal';
import {
  scopeFilter, getLastFeeding, formatTimeAgo, formatHHMM,
  formatDuration, formatBabyAge, summarizeStats,
  RECENT_ICON_MAP, buildRowMain, buildRowTail,
} from '../dataHelpers';

// 백엔드 연결 전 임시: true 면 mock 데이터, false 면 진짜 API 사용
const USE_MOCK = false;

const TODAY_STR = (() => {
  const d = new Date();
  const ds = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ds[d.getDay()]}`;
})();

const SCOPES = [
  { key: 'yesterday', label: '어제',  statsLabel: '어제',  recentLabel: '어제 기록' },
  { key: 'today',     label: '오늘',  statsLabel: '오늘',  recentLabel: '최근 기록' },
  { key: 'week',      label: '주간',  statsLabel: '이번 주', recentLabel: '주간 기록' },
];

// 수유 간격 기본값 (분) — 평균 데이터 부족할 때 사용
const DEFAULT_FEEDING_INTERVAL = 180; // 3시간

export default function HomeScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { logout } = useAuth();
  const { activeBaby, babies, editBaby } = useBaby();
  const [scope, setScope] = useState('today');
  const [records, setRecords] = useState(USE_MOCK ? MOCK_RECORDS : []);
  const [alarmsOn, setAlarmsOn] = useState(true);
  const [alarmThreshold, setAlarmThreshold] = useState(DEFAULT_FEEDING_INTERVAL);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingBaby, setEditingBaby] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const baby = activeBaby;

  useFocusEffect(useCallback(() => {
    if (USE_MOCK) return;
    let alive = true;
    getRecords(activeBaby?.id)
      .then((recs) => { if (alive) setRecords(recs); })
      .catch(() => { if (alive) setRecords([]); });
    return () => { alive = false; };
  }, [activeBaby?.id]));

  async function handleSaveBaby(payload) {
    if (editingBaby?.id) {
      await editBaby(editingBaby.id, payload);
    }
    setEditingBaby(null);
  }

  // 헤더: 타이틀은 항상 프로젝트명 고정. 아기 이름·나이·성별은 서브 라인에 표시.
  const headerSubParts = [];
  if (baby?.name)       headerSubParts.push(baby.name);
  if (baby?.birth_date) headerSubParts.push(formatBabyAge(baby.birth_date));
  if (baby?.gender)     headerSubParts.push(baby.gender);
  const headerSub = headerSubParts.length > 0
    ? headerSubParts.join(' · ')
    : '아기 정보를 입력해주세요';

  const scoped     = useMemo(() => scopeFilter(records, scope), [records, scope]);
  const stats      = useMemo(() => summarizeStats(scoped), [scoped]);
  const lastFeed   = useMemo(() => getLastFeeding(records), [records]);
  const recent     = scoped.slice(0, 4);
  const scopeMeta  = SCOPES.find((s) => s.key === scope);

  // 마지막 수유 표시
  const ago = lastFeed ? formatTimeAgo(lastFeed.created_at) : null;
  const lastFeedSubtitle = lastFeed
    ? lastFeed.category === '분유기록'
      ? `분유 ${lastFeed.detail?.amount_ml ?? '?'}ml · ${formatHHMM(lastFeed.created_at)}`
      : `모유 ${lastFeed.detail?.duration_min ?? '?'}분 · ${formatHHMM(lastFeed.created_at)}`
    : '아직 수유 기록 없음';
  const showSoonPill = alarmsOn && ago && ago.totalMinutes >= alarmThreshold;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER ROW */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.profileTap}
            onPress={() => setSelectorOpen(true)}
            activeOpacity={0.7}
          >
            <BrandLogo size={40} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>BabyAutoLog</Text>
              <View style={styles.headerSubRow}>
                <Text style={styles.headerSub} numberOfLines={1}>{headerSub}</Text>
                <Ionicons name="chevron-forward" size={12} color={C.inkMute} />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerToggleSlot}>
            <DarkModeToggle />
          </View>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            hitSlop={6}
            style={styles.headerIconBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="settings-outline" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>

        {/* DATE ROW */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{TODAY_STR}</Text>
          <View style={styles.dateTabs}>
            {SCOPES.map((s) => {
              const active = s.key === scope;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setScope(s.key)}
                  hitSlop={6}
                  activeOpacity={0.6}
                >
                  <View style={active ? styles.dateTabActiveWrap : null}>
                    <Text style={[styles.dateTab, active && styles.dateTabActive]}>
                      {s.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* HERO — 마지막 수유 (scope 무관, 항상 최신) */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>마지막 수유</Text>
            {showSoonPill && (
              <View style={styles.mintPill}>
                <Text style={styles.mintPillText}>곧 수유</Text>
              </View>
            )}
          </View>
          {ago ? (
            <View style={styles.heroNumberRow}>
              <Text style={styles.heroNumber}>{ago.hours}</Text>
              <Text style={styles.heroUnit}>시간</Text>
              <Text style={[styles.heroNumber, { marginLeft: 12 }]}>{ago.minutes}</Text>
              <Text style={styles.heroUnit}>분 전</Text>
            </View>
          ) : (
            <Text style={[styles.heroNumber, { fontSize: 28 }]}>기록 없음</Text>
          )}
          <Text style={styles.heroSub}>{lastFeedSubtitle}</Text>
        </View>

        {/* STATS */}
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>{scopeMeta.statsLabel}</Text>
          <Text style={styles.sectionRight}>총 {stats.total}건</Text>
        </View>
        <View style={styles.statsRow}>
          <StatBox
            styles={styles}
            label="분유"
            value={stats.formula.total_ml > 0 ? String(stats.formula.total_ml) : '-'}
            unit={stats.formula.total_ml > 0 ? 'ml' : ''}
            sub={
              stats.formula.count > 0
                ? `${stats.formula.count}회 · 평균 ${stats.formula.avg_ml}`
                : '기록 없음'
            }
          />
          <StatBox
            styles={styles}
            label="수면"
            parts={
              stats.sleep.total_min > 0
                ? [
                    { text: String(Math.floor(stats.sleep.total_min / 60)) },
                    { text: '시간 ', small: true },
                    { text: String(stats.sleep.total_min % 60) },
                    { text: '분', small: true },
                  ]
                : null
            }
            value={stats.sleep.total_min > 0 ? null : '-'}
            sub={
              stats.sleep.count > 0
                ? `낮잠 ${stats.sleep.nap_count}회`
                : '기록 없음'
            }
          />
          <StatBox
            styles={styles}
            label="기저귀"
            value={stats.diaper.total > 0 ? String(stats.diaper.total) : '-'}
            unit={stats.diaper.total > 0 ? '회' : ''}
            sub={
              stats.diaper.total > 0
                ? `소 ${stats.diaper.so} · 대 ${stats.diaper.dae}`
                : '기록 없음'
            }
          />
        </View>

        {/* RECENT */}
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>{scopeMeta.recentLabel}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RecordList')}>
            <Text style={styles.sectionRight}>전체 보기 ›</Text>
          </TouchableOpacity>
        </View>
        {recent.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyText}>{scopeMeta.label}는 아직 기록이 없어요</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recent.map((r, i) => (
              <View
                key={r.id}
                style={[
                  styles.recentRow,
                  i < recent.length - 1 && styles.recentRowBorder,
                ]}
              >
                <Text style={styles.recentTime}>{formatHHMM(r.created_at)}</Text>
                <View style={styles.recentIcon}>
                  <Ionicons
                    name={RECENT_ICON_MAP[r.category] || 'reader-outline'}
                    size={14}
                    color={C.inkSoft}
                  />
                </View>
                <Text style={styles.recentText} numberOfLines={1}>
                  {buildRowMain(r)}
                </Text>
                <Text style={styles.recentTail} numberOfLines={1}>
                  {buildRowTail(r)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomTabBar navigation={navigation} current="Home" />

      <BabySelectorModal
        visible={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onAddBaby={() => { setEditingBaby(null); setProfileOpen(true); }}
        onEditBaby={(b) => { setEditingBaby(b); setProfileOpen(true); }}
      />

      <BabyProfileModal
        visible={profileOpen}
        baby={editingBaby}
        onClose={() => { setProfileOpen(false); setEditingBaby(null); }}
        onSave={handleSaveBaby}
      />

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        alarmsOn={alarmsOn}
        onToggleAlarms={() => setAlarmsOn((v) => !v)}
        alarmThreshold={alarmThreshold}
        onChangeThreshold={setAlarmThreshold}
        onOpenBabyProfile={() => setSelectorOpen(true)}
        babyName={baby?.name}
        onLogout={logout}
      />
    </SafeAreaView>
  );
}

function StatBox({ label, value, unit, parts, sub, styles }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.statValRow}>
        {parts ? (
          parts.map((p, i) => (
            <Text
              key={i}
              numberOfLines={1}
              style={p.small ? styles.statSmallUnit : styles.statValue}
            >
              {p.text}
            </Text>
          ))
        ) : (
          <>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </Text>
            {unit ? <Text style={styles.statUnit} numberOfLines={1}>{unit}</Text> : null}
          </>
        )}
      </View>
      <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  profileTap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: SERIF_ITALIC,
    color: C.ink,
    letterSpacing: 0,
  },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  headerSub: { fontSize: 12, color: C.inkSoft, fontWeight: '500', flexShrink: 1 },
  headerIconBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  headerToggleSlot: { paddingHorizontal: 4 },
  bellDot: {
    position: 'absolute', top: 2, right: 4,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.forest,
  },

  dateRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  dateText: { fontSize: 12, color: C.inkSoft, fontWeight: '600' },
  dateTabs: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateTab: { fontSize: 13, color: C.inkMute, fontWeight: '600' },
  dateTabActiveWrap: { borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 1 },
  dateTabActive: { color: C.ink, fontWeight: '800' },

  heroCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border,
  },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, minHeight: 22,
  },
  heroLabel: { fontSize: 12, color: C.inkSoft, fontWeight: '700' },
  mintPill: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 999, backgroundColor: C.mintBg,
  },
  mintPillText: { fontSize: 11, color: C.mintInk, fontWeight: '800' },
  heroNumberRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroNumber: { fontSize: 52, fontWeight: '900', color: C.ink, letterSpacing: -2 },
  heroUnit: { fontSize: 15, color: C.ink, marginLeft: 4, fontWeight: '600' },
  heroSub: { fontSize: 11, color: C.inkMute, marginTop: 6 },

  sectionHeadRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 22, marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.ink },
  sectionRight: { fontSize: 11, color: C.inkMute, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: C.card, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  statLabel: { fontSize: 10, color: C.inkSoft, fontWeight: '700', marginBottom: 4 },
  statValRow: { flexDirection: 'row', alignItems: 'baseline' },
  statValue: { fontSize: 18, fontWeight: '900', color: C.ink, letterSpacing: -0.5 },
  statUnit: { fontSize: 11, color: C.ink, fontWeight: '700', marginLeft: 2 },
  // 한글 단위 ("시간"/"분")는 숫자보다 훨씬 작게 — 한 줄에 들어오게
  statSmallUnit: { fontSize: 9, color: C.ink, fontWeight: '700', alignSelf: 'flex-end', marginBottom: 3 },
  statSub: { fontSize: 9, color: C.inkMute, marginTop: 4 },

  recentList: {
    backgroundColor: C.card, borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  recentTime: { fontSize: 11, color: C.inkSoft, width: 40, fontWeight: '600' },
  recentIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.cardSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  recentText: { flex: 1, fontSize: 13, color: C.ink, fontWeight: '700' },
  recentTail: { fontSize: 10, color: C.inkMute, fontWeight: '500', marginLeft: 8 },

  emptyRecent: {
    backgroundColor: C.card, borderRadius: 14,
    paddingVertical: 28, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  emptyText: { fontSize: 12, color: C.inkMute, fontWeight: '500' },
});
