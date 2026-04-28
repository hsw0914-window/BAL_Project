import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getRecords, getRecordsByCategory, deleteRecord } from '../services/api';

const CATEGORIES = [
  '전체', '모유기록', '분유기록', '이유식기록', '기저귀기록',
  '수면기록', '성장기록', '발달기록', '건강기록', '병원기록', '일상기록',
];

const CATEGORY_COLORS = {
  '모유기록':   { bg: '#FDF2F8', text: '#9D174D' },
  '분유기록':   { bg: '#FFF7ED', text: '#9A3412' },
  '이유식기록': { bg: '#FFFBEB', text: '#92400E' },
  '기저귀기록': { bg: '#F0FDF4', text: '#166534' },
  '수면기록':   { bg: '#EFF6FF', text: '#1E40AF' },
  '성장기록':   { bg: '#F5F3FF', text: '#5B21B6' },
  '발달기록':   { bg: '#FFF1F2', text: '#9F1239' },
  '건강기록':   { bg: '#FEF2F2', text: '#991B1B' },
  '병원기록':   { bg: '#ECFDF5', text: '#065F46' },
  '일상기록':   { bg: '#F8FAFC', text: '#475569' },
};

// 카테고리별 구조화 데이터를 읽기 좋은 칩 배열로 변환
function buildChips(category, detail = {}) {
  if (!detail) return [];
  const chips = [];

  switch (category) {
    case '모유기록':
      if (detail.duration_min != null) chips.push(`${detail.duration_min}분`);
      break;
    case '분유기록':
      if (detail.amount_ml != null) chips.push(`${detail.amount_ml}ml`);
      break;
    case '이유식기록':
      if (detail.food_name) chips.push(detail.food_name);
      if (detail.amount_g != null) chips.push(`${detail.amount_g}g`);
      if (detail.reaction) chips.push(detail.reaction);
      break;
    case '기저귀기록':
      if (detail.type) chips.push(detail.type);
      break;
    case '수면기록':
      if (detail.sleep_type) chips.push(detail.sleep_type);
      if (detail.duration_min != null) chips.push(`${detail.duration_min}분`);
      break;
    case '성장기록':
      if (detail.height_cm != null) chips.push(`키 ${detail.height_cm}cm`);
      if (detail.weight_kg != null) chips.push(`몸무게 ${detail.weight_kg}kg`);
      if (detail.head_cm != null) chips.push(`두위 ${detail.head_cm}cm`);
      break;
    case '발달기록':
      if (detail.milestone) chips.push(detail.milestone);
      break;
    case '건강기록':
      if (detail.temperature != null) chips.push(`${detail.temperature}℃`);
      if (detail.medicine) chips.push(detail.medicine);
      if (detail.symptom) chips.push(detail.symptom);
      break;
    case '병원기록':
      if (detail.hospital_name) chips.push(detail.hospital_name);
      if (detail.purpose) chips.push(detail.purpose);
      if (detail.prescription) chips.push(detail.prescription);
      break;
    case '일상기록':
      if (detail.memo) chips.push(detail.memo);
      break;
    default:
      break;
  }
  return chips;
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function RecordListScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = selectedCategory === '전체'
        ? await getRecords()
        : await getRecordsByCategory(selectedCategory);
      setRecords(data);
    } catch (e) {
      Alert.alert('오류', '기록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useFocusEffect(useCallback(() => { fetchRecords(); }, [fetchRecords]));

  async function handleDelete(id) {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(id);
            setRecords((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert('오류', '삭제에 실패했어요.');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['일상기록'];
    const chips = buildChips(item.category, item.detail);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Text style={[styles.badgeText, { color: color.text }]}>{item.category}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.summary}>{item.summary}</Text>

        {chips.length > 0 && (
          <View style={styles.chipRow}>
            {chips.map((chip, idx) => (
              <View key={idx} style={[styles.chip, { borderColor: color.text + '40' }]}>
                <Text style={[styles.chipText, { color: color.text }]}>{chip}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>삭제</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>기록 목록</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, selectedCategory === cat && styles.tabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : records.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>아직 기록이 없어요</Text>
            <TouchableOpacity
              style={styles.goInputBtn}
              onPress={() => navigation.navigate('RecordInput')}
            >
              <Text style={styles.goInputBtnText}>기록 입력하러 가기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },

  header: { paddingHorizontal: 24, paddingTop: 16, marginBottom: 12 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: 24, gap: 8, paddingBottom: 12 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, backgroundColor: '#E2E8F0',
  },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 11, color: '#94A3B8' },
  summary: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  deleteBtn: { alignSelf: 'flex-end' },
  deleteBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 15, color: '#94A3B8' },
  goInputBtn: {
    backgroundColor: '#3B82F6', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  goInputBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
