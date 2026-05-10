import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import {
  getFeedingStats, getSleepStats,
  getGrowthStats, getSummaryStats,
} from '../services/api';
import {
  MOCK_SUMMARY, MOCK_SUMMARY_30,
  MOCK_FEEDING, MOCK_SLEEP, MOCK_GROWTH,
} from '../mockData';
import { useTheme } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import BottomTabBar from '../components/BottomTabBar';

// 백엔드 연결 전 임시: true 면 mock 데이터, false 면 진짜 API 사용
const USE_MOCK = false;

const SCREEN_WIDTH = Dimensions.get('window').width;
// gifted-charts의 width = (y축 라벨 영역 + 막대 영역) 전체. y축은 lib 내부에서 자동 할당.
// 화면 패딩(20*2) + 카드 패딩(16*2) 만 빼면 됨.
const CHART_WIDTH = Math.max(240, Math.min(SCREEN_WIDTH, 480) - 20 * 2 - 16 * 2);
// gifted-charts가 width 안에서 y축 라벨에 ~40px 할당 → 그만큼 빼고 막대 폭 계산
const Y_AXIS_RESERVE = 40;

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getDayLabel(dateStr) {
  return DAY_LABELS[new Date(dateStr).getDay()];
}
function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 막대 갯수에 맞춰 width/spacing/sideSpacing 정확히 계산.
// 핵심: labelWidth = barWidth + spacing 으로 두면 라벨과 막대 좌표가 정확히 일치함.
function computeBarLayout(barCount) {
  const available = CHART_WIDTH - Y_AXIS_RESERVE;
  const SPACING_RATIO = 0.5;
  const denom = barCount + (barCount + 1) * SPACING_RATIO;
  const barWidth = Math.max(6, Math.floor(available / denom));
  const spacing = Math.max(2, Math.floor(barWidth * SPACING_RATIO));
  const used = barCount * barWidth + Math.max(0, barCount - 1) * spacing;
  const sideSpace = Math.max(spacing, Math.floor((available - used) / 2));
  // gifted-charts 내부에서 라벨 컨테이너 width = labelWidth + spacing 으로 그림.
  // labelWidth = barWidth 로 두면 라벨이 정확히 한 막대 슬롯(barWidth + spacing) 폭 차지.
  return {
    barWidth,
    spacing,
    initialSpacing: sideSpace,
    endSpacing: sideSpace,
    labelWidth: barWidth,
  };
}

// 30일은 너무 빽빽하니 5개 주간 버킷으로 집계 → 막대 5개
const WEEKLY_BUCKETS = 5;
const DAYS_PER_BUCKET = 6; // 30일 / 5 = 6일/주

function bucketize(dates, valueOf) {
  const buckets = [];
  for (let i = 0; i < WEEKLY_BUCKETS; i++) {
    const slice = dates.slice(i * DAYS_PER_BUCKET, (i + 1) * DAYS_PER_BUCKET);
    if (slice.length === 0) continue;
    const sum = slice.reduce((s, d) => s + (valueOf(d) || 0), 0);
    const startDate = new Date(slice[0]);
    buckets.push({
      value: sum,
      label: `${startDate.getMonth() + 1}/${startDate.getDate()}`,
    });
  }
  return buckets;
}
function getRecentDates(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    return d.toISOString().split('T')[0];
  });
}
function toDateMap(rows, key) {
  const map = {};
  rows.forEach((row) => { map[row.date] = row[key] || 0; });
  return map;
}

export default function ReportScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(false);
  const [feeding, setFeeding] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        setFeeding(MOCK_FEEDING);
        setSleep(MOCK_SLEEP);
        setGrowth(MOCK_GROWTH);
        setSummary(period === 7 ? MOCK_SUMMARY : MOCK_SUMMARY_30);
      } else {
        const [f, s, g, sum] = await Promise.all([
          getFeedingStats(period),
          getSleepStats(period),
          getGrowthStats(),
          getSummaryStats(period),
        ]);
        setFeeding(f);
        setSleep(s);
        setGrowth(g);
        setSummary(sum);
      }
    } catch (e) { /* keep empty */ } finally { setLoading(false); }
  }, [period]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  function buildFeedingData() {
    const formulaMap = toDateMap(feeding?.formula || [], 'amount_ml');
    const breastMap  = toDateMap(feeding?.breastfeeding || [], 'duration_min');
    const valueOf = (d) => formulaMap[d] || breastMap[d] || 0;

    if (period <= 7) {
      const dates = getRecentDates(7);
      return dates.map((date) => ({
        value: valueOf(date),
        label: getDayLabel(date),
        frontColor: C.ink,
      }));
    }
    // 월간 → 5주 버킷
    const dates = getRecentDates(30);
    return bucketize(dates, valueOf).map((b) => ({ ...b, frontColor: C.ink }));
  }

  function buildSleepData() {
    const napMap = {}, nightMap = {};
    (sleep || []).forEach((row) => {
      if (row.sleep_type === '낮잠') napMap[row.date] = row.duration_min || 0;
      else nightMap[row.date] = row.duration_min || 0;
    });
    const valueOf = (d) =>
      Math.round(((napMap[d] || 0) + (nightMap[d] || 0)) / 60 * 10) / 10;

    if (period <= 7) {
      const dates = getRecentDates(7);
      return dates.map((date) => ({
        value: valueOf(date),
        label: getDayLabel(date),
        frontColor: C.mintInk,
      }));
    }
    const dates = getRecentDates(30);
    return bucketize(dates, valueOf).map((b) => ({
      // 합계가 너무 커지므로 평균(시간/일)으로 표기
      value: Math.round((b.value / DAYS_PER_BUCKET) * 10) / 10,
      label: b.label,
      frontColor: C.mintInk,
    }));
  }

  function buildHeightData() {
    return (growth || [])
      .filter((r) => r.height_cm != null)
      .map((r) => ({
        value: r.height_cm,
        label: getMonthLabel(r.date),
        dataPointText: `${r.height_cm}`,
      }));
  }
  function buildWeightData() {
    return (growth || [])
      .filter((r) => r.weight_kg != null)
      .map((r) => ({
        value: r.weight_kg,
        label: getMonthLabel(r.date),
        dataPointText: `${r.weight_kg}`,
      }));
  }

  const feedingData = feeding ? buildFeedingData() : [];
  const sleepData = sleep ? buildSleepData() : [];
  const heightData = buildHeightData();
  const weightData = buildWeightData();

  // 7일이면 막대 7개, 30일이면 5주 버킷
  const barCount = period <= 7 ? 7 : WEEKLY_BUCKETS;
  const layout = computeBarLayout(barCount);

  const hasFeeding = feedingData.some((d) => d.value > 0);
  const hasSleep = sleepData.some((d) => d.value > 0);
  const hasHeight = heightData.length >= 2;
  const hasWeight = weightData.length >= 2;

  const sharedAxis = {
    xAxisColor: C.borderSoft,
    xAxisThickness: 1,
    yAxisThickness: 0,
    rulesColor: C.borderSoft,
    rulesType: 'dashed',
    yAxisTextStyle: { color: C.inkMute, fontSize: 10 },
    xAxisLabelTextStyle: { color: C.inkSoft, fontSize: 11, fontWeight: '600' },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="리포트"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Period toggle */}
        <View style={styles.toggle}>
          {[7, 30].map((d) => {
            const active = period === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                onPress={() => setPeriod(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {d === 7 ? '주간' : '월간'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.ink} />
          </View>
        ) : (
          <>
            {/* SUMMARY */}
            {summary && (
              <>
                <Text style={styles.sectionTitle}>
                  {period === 7 ? '주간 합계' : '월간 합계'}
                </Text>
                <Text style={styles.sectionSub}>
                  최근 {period}일간 누적 합계
                </Text>
                <View style={styles.summaryGrid}>
                  <SummaryItem styles={styles} label="전체 기록" value={summary.total_records} unit="건" />
                  <SummaryItem styles={styles} label="기저귀 교체" value={summary.diaper_count} unit="회" />
                  <SummaryItem styles={styles} label="건강 이상" value={summary.health_count} unit="건" />
                  <SummaryItem styles={styles} label="병원 방문" value={summary.hospital_count} unit="회" />
                </View>
              </>
            )}

            {/* FEEDING */}
            <Text style={styles.sectionTitle}>수유량</Text>
            <Text style={styles.sectionSub}>
              {period <= 7 ? '일별 합계 · 분유(ml) / 모유(분)' : '주별 합계 · 분유(ml) / 모유(분)'}
            </Text>
            <View style={styles.chartCard}>
              {hasFeeding ? (
                <BarChart
                  data={feedingData}
                  width={CHART_WIDTH}
                  barWidth={layout.barWidth}
                  spacing={layout.spacing}
                  initialSpacing={layout.initialSpacing}
                  endSpacing={layout.endSpacing}
                  labelWidth={layout.labelWidth}
                  roundedTop
                  noOfSections={4}
                  disableScroll
                  isAnimated
                  {...sharedAxis}
                />
              ) : <Empty styles={styles} C={C} />}
            </View>

            {/* SLEEP */}
            <Text style={styles.sectionTitle}>수면 패턴</Text>
            <Text style={styles.sectionSub}>
              {period <= 7 ? '일별 총 수면 시간' : '주별 1일 평균 수면 시간'}
            </Text>
            <View style={styles.chartCard}>
              {hasSleep ? (
                <BarChart
                  data={sleepData}
                  width={CHART_WIDTH}
                  barWidth={layout.barWidth}
                  spacing={layout.spacing}
                  initialSpacing={layout.initialSpacing}
                  endSpacing={layout.endSpacing}
                  labelWidth={layout.labelWidth}
                  roundedTop
                  noOfSections={4}
                  yAxisSuffix="h"
                  disableScroll
                  isAnimated
                  {...sharedAxis}
                />
              ) : <Empty styles={styles} C={C} />}
            </View>

            {/* GROWTH */}
            <Text style={styles.sectionTitle}>성장 기록</Text>
            <Text style={styles.sectionSub}>측정일별 키·몸무게 변화</Text>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>키 (cm)</Text>
              <View style={{ height: 12 }} />
              {hasHeight ? (
                <LineChart
                  data={heightData}
                  width={CHART_WIDTH}
                  color={C.ink}
                  thickness={2}
                  curved
                  dataPointsColor={C.ink}
                  dataPointsRadius={4}
                  startFillColor={C.cardSoft}
                  endFillColor={C.card}
                  areaChart
                  adjustToWidth
                  initialSpacing={20}
                  endSpacing={20}
                  isAnimated
                  {...sharedAxis}
                />
              ) : <Empty styles={styles} C={C} message="성장 기록이 2개 이상 필요해요" />}
              <View style={{ height: 24 }} />
              <Text style={styles.chartTitle}>몸무게 (kg)</Text>
              <View style={{ height: 12 }} />
              {hasWeight ? (
                <LineChart
                  data={weightData}
                  width={CHART_WIDTH}
                  color={C.mintInk}
                  thickness={2}
                  curved
                  dataPointsColor={C.mintInk}
                  dataPointsRadius={4}
                  startFillColor={C.mintBg}
                  endFillColor={C.card}
                  areaChart
                  adjustToWidth
                  initialSpacing={20}
                  endSpacing={20}
                  isAnimated
                  {...sharedAxis}
                />
              ) : <Empty styles={styles} C={C} message="성장 기록이 2개 이상 필요해요" />}
            </View>
          </>
        )}
      </ScrollView>

      <BottomTabBar navigation={navigation} current="Report" />
    </SafeAreaView>
  );
}

function SummaryItem({ styles, label, value, unit }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValueRow}>
        <Text style={styles.summaryValue}>{value}</Text>
        {unit ? <Text style={styles.summaryUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function Empty({ styles, C, message = '아직 데이터가 없어요' }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="bar-chart-outline" size={22} color={C.inkMute} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: C.cardSoft,
    borderRadius: 12, padding: 3,
    alignSelf: 'flex-start', marginBottom: 18,
    borderWidth: 1, borderColor: C.borderSoft,
  },
  toggleBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 9 },
  toggleBtnActive: { backgroundColor: C.ink },
  toggleText: { fontSize: 12, color: C.inkSoft, fontWeight: '700' },
  toggleTextActive: { color: C.bg, fontWeight: '800' },

  center: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: {
    fontSize: 13, fontWeight: '900', color: C.ink,
    letterSpacing: -0.2, marginTop: 22, marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11, color: C.inkMute, fontWeight: '500',
    marginBottom: 10,
  },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: {
    flex: 1, minWidth: '46%',
    backgroundColor: C.card, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border,
  },
  summaryLabel: { fontSize: 11, color: C.inkSoft, fontWeight: '700', marginBottom: 6 },
  summaryValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  summaryValue: { fontSize: 26, fontWeight: '900', color: C.ink, letterSpacing: -1 },
  summaryUnit: { fontSize: 12, color: C.ink, fontWeight: '700', marginLeft: 3 },

  chartCard: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  chartHeadRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  chartTitle: { fontSize: 14, fontWeight: '800', color: C.ink },
  chartSub: { fontSize: 11, color: C.inkMute, marginTop: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: C.inkSoft, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  empty: {
    height: 120, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.cardSoft, borderRadius: 12,
  },
  emptyText: { fontSize: 12, color: C.inkMute },
});
