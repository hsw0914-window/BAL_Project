import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import {
  getFeedingStats, getSleepStats,
  getGrowthStats, getSummaryStats,
} from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64; // 좌우 패딩 32*2

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getDayLabel(dateStr) {
  return DAY_LABELS[new Date(dateStr).getDay()];
}

function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 최근 N일 날짜 배열 생성
function getRecentDates(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    return d.toISOString().split('T')[0];
  });
}

// 날짜별 데이터 맵으로 변환
function toDateMap(rows, key) {
  const map = {};
  rows.forEach((row) => { map[row.date] = row[key] || 0; });
  return map;
}

export default function ReportScreen({ navigation }) {
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(false);
  const [feeding, setFeeding] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch (e) {
      // 데이터 없으면 빈 상태 유지
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // ── 수유 차트 데이터 ──────────────────────────
  function buildFeedingData() {
    const dates = getRecentDates(period);
    const formulaMap = toDateMap(feeding?.formula || [], 'amount_ml');
    const breastMap = toDateMap(feeding?.breastfeeding || [], 'duration_min');

    return dates.map((date) => ({
      value: formulaMap[date] || breastMap[date] || 0,
      label: period <= 7 ? getDayLabel(date) : getMonthLabel(date),
      frontColor: '#3B82F6',
      topLabelComponent: () => {
        const v = formulaMap[date] || breastMap[date] || 0;
        return v > 0 ? (
          <Text style={{ fontSize: 9, color: '#64748B', marginBottom: 2 }}>{v}</Text>
        ) : null;
      },
    }));
  }

  // ── 수면 차트 데이터 ──────────────────────────
  function buildSleepData() {
    const dates = getRecentDates(period);
    const napMap = {};
    const nightMap = {};

    (sleep || []).forEach((row) => {
      if (row.sleep_type === '낮잠') napMap[row.date] = row.duration_min || 0;
      else nightMap[row.date] = row.duration_min || 0;
    });

    const nap = dates.map((date) => ({
      value: Math.round((napMap[date] || 0) / 60 * 10) / 10,
      label: period <= 7 ? getDayLabel(date) : getMonthLabel(date),
      frontColor: '#BAE6FD',
      stackData: [
        { value: Math.round((napMap[date] || 0) / 60 * 10) / 10, color: '#BAE6FD' },
        { value: Math.round((nightMap[date] || 0) / 60 * 10) / 10, color: '#1E40AF' },
      ],
    }));
    return nap;
  }

  // ── 성장 차트 데이터 ──────────────────────────
  function buildHeightData() {
    return (growth || [])
      .filter((r) => r.height_cm != null)
      .map((r) => ({ value: r.height_cm, label: getMonthLabel(r.date), dataPointText: `${r.height_cm}` }));
  }

  function buildWeightData() {
    return (growth || [])
      .filter((r) => r.weight_kg != null)
      .map((r) => ({ value: r.weight_kg, label: getMonthLabel(r.date), dataPointText: `${r.weight_kg}` }));
  }

  const feedingData = feeding ? buildFeedingData() : [];
  const sleepData = sleep ? buildSleepData() : [];
  const heightData = buildHeightData();
  const weightData = buildWeightData();

  const hasFeedingData = feedingData.some((d) => d.value > 0);
  const hasSleepData = sleepData.some((d) => d.value > 0);
  const hasHeightData = heightData.length >= 2;
  const hasWeightData = weightData.length >= 2;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>리포트</Text>
        </View>

        {/* 기간 토글 */}
        <View style={styles.toggle}>
          {[7, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.toggleBtn, period === d && styles.toggleBtnActive]}
              onPress={() => setPeriod(d)}
            >
              <Text style={[styles.toggleText, period === d && styles.toggleTextActive]}>
                {d === 7 ? '주간' : '월간'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <>
            {/* 요약 카드 */}
            {summary && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 {period === 7 ? '이번 주' : '이번 달'} 요약</Text>
                <View style={styles.summaryGrid}>
                  <SummaryItem label="전체 기록" value={`${summary.total_records}건`} color="#3B82F6" />
                  <SummaryItem label="기저귀 교체" value={`${summary.diaper_count}회`} color="#22C55E" />
                  <SummaryItem label="건강 이상" value={`${summary.health_count}건`} color="#EF4444" />
                  <SummaryItem label="병원 방문" value={`${summary.hospital_count}회`} color="#F97316" />
                </View>
              </View>
            )}

            {/* 수유량 차트 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🍼 수유량</Text>
              <Text style={styles.cardSub}>분유(ml) / 모유(분)</Text>
              {hasFeedingData ? (
                <BarChart
                  data={feedingData}
                  width={CHART_WIDTH}
                  barWidth={period <= 7 ? 28 : 14}
                  spacing={period <= 7 ? 18 : 8}
                  roundedTop
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={0}
                  xAxisColor="#E2E8F0"
                  yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11 }}
                  noOfSections={4}
                  isAnimated
                />
              ) : (
                <EmptyChart />
              )}
            </View>

            {/* 수면 패턴 차트 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>😴 수면 패턴</Text>
              <View style={styles.legend}>
                <LegendDot color="#BAE6FD" label="낮잠" />
                <LegendDot color="#1E40AF" label="야간수면" />
              </View>
              {hasSleepData ? (
                <BarChart
                  data={sleepData}
                  width={CHART_WIDTH}
                  barWidth={period <= 7 ? 28 : 14}
                  spacing={period <= 7 ? 18 : 8}
                  roundedTop
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={0}
                  xAxisColor="#E2E8F0"
                  yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11 }}
                  noOfSections={4}
                  yAxisSuffix="h"
                  isAnimated
                />
              ) : (
                <EmptyChart />
              )}
            </View>

            {/* 성장 기록 - 키 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📏 성장 기록</Text>
              <Text style={styles.cardSub}>키 (cm)</Text>
              {hasHeightData ? (
                <LineChart
                  data={heightData}
                  width={CHART_WIDTH}
                  color="#3B82F6"
                  thickness={2}
                  curved
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={0}
                  xAxisColor="#E2E8F0"
                  yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11 }}
                  dataPointsColor="#3B82F6"
                  dataPointsRadius={4}
                  startFillColor="#DBEAFE"
                  endFillColor="#fff"
                  areaChart
                  isAnimated
                />
              ) : (
                <EmptyChart message="성장 기록이 2개 이상 필요해요" />
              )}
              <Text style={[styles.cardSub, { marginTop: 20 }]}>몸무게 (kg)</Text>
              {hasWeightData ? (
                <LineChart
                  data={weightData}
                  width={CHART_WIDTH}
                  color="#22C55E"
                  thickness={2}
                  curved
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={0}
                  xAxisColor="#E2E8F0"
                  yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11 }}
                  dataPointsColor="#22C55E"
                  dataPointsRadius={4}
                  startFillColor="#DCFCE7"
                  endFillColor="#fff"
                  areaChart
                  isAnimated
                />
              ) : (
                <EmptyChart message="성장 기록이 2개 이상 필요해요" />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function EmptyChart({ message = '아직 데이터가 없어요' }) {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyChartText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 24, paddingBottom: 48 },

  header: { marginBottom: 16 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  toggleTextActive: { color: '#1E293B' },

  center: { height: 200, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#94A3B8', marginBottom: 16 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  summaryItem: {
    flex: 1, minWidth: '40%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: '#64748B' },

  legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748B' },

  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  emptyChartText: { fontSize: 13, color: '#94A3B8' },
});
