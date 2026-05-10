import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getRecords, getRecordsByCategory, deleteRecord } from '../services/api';
import { useTheme, CATEGORY_ICONS } from '../theme';
import { MOCK_RECORDS } from '../mockData';
import { parseUTC } from '../dataHelpers';
import ScreenHeader from '../components/ScreenHeader';
import BottomTabBar from '../components/BottomTabBar';

// 백엔드 연결 전 임시: true 면 mock 데이터, false 면 진짜 API 사용
const USE_MOCK = false;

const CATEGORIES = [
  '전체', '모유기록', '분유기록', '이유식기록', '기저귀기록',
  '수면기록', '성장기록', '발달기록', '건강기록', '병원기록', '일상기록',
];

function buildChips(category, detail = {}) {
  if (!detail) return [];
  const chips = [];
  switch (category) {
    case '모유기록':   if (detail.duration_min != null) chips.push(`${detail.duration_min}분`); break;
    case '분유기록':   if (detail.amount_ml != null) chips.push(`${detail.amount_ml}ml`); break;
    case '이유식기록':
      if (detail.food_name) chips.push(detail.food_name);
      if (detail.amount_g != null) chips.push(`${detail.amount_g}g`);
      if (detail.reaction) chips.push(detail.reaction);
      break;
    case '기저귀기록': if (detail.type) chips.push(detail.type); break;
    case '수면기록':
      if (detail.sleep_type) chips.push(detail.sleep_type);
      if (detail.duration_min != null) chips.push(`${detail.duration_min}분`);
      break;
    case '성장기록':
      if (detail.height_cm != null) chips.push(`키 ${detail.height_cm}cm`);
      if (detail.weight_kg != null) chips.push(`몸무게 ${detail.weight_kg}kg`);
      if (detail.head_cm != null) chips.push(`두위 ${detail.head_cm}cm`);
      break;
    case '발달기록':   if (detail.milestone) chips.push(detail.milestone); break;
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
    case '일상기록':   if (detail.memo) chips.push(detail.memo); break;
    default: break;
  }
  return chips;
}

function formatDayHeader(isoStr) {
  const d = parseUTC(isoStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const base = `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`;
  if (isSameDay(d, today)) return `${base} · 오늘`;
  if (isSameDay(d, yesterday)) return `${base} · 어제`;
  return base;
}

function formatTime(isoStr) {
  const d = parseUTC(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function dateKey(isoStr) {
  const d = parseUTC(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function RecordListScreen({ navigation }) {
  const { C, CATEGORY_COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (USE_MOCK) {
        data = selectedCategory === '전체'
          ? MOCK_RECORDS
          : MOCK_RECORDS.filter((r) => r.category === selectedCategory);
      } else {
        data = selectedCategory === '전체'
          ? await getRecords()
          : await getRecordsByCategory(selectedCategory);
      }
      setRecords(data);
    } catch (e) {
      Alert.alert('오류', '기록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useFocusEffect(useCallback(() => { fetchRecords(); }, [fetchRecords]));

  // 검색 쿼리 적용 (summary + original_text + category 매칭)
  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const haystack = [
        r.summary,
        r.original_text,
        r.category,
        ...Object.values(r.detail || {}).map((v) => String(v ?? '')),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [records, query]);

  // 날짜별 그룹 데이터를 FlatList용 평면 배열로 변환
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of filteredRecords) {
      const k = dateKey(r.created_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    const items = [];
    for (const [k, rows] of map.entries()) {
      items.push({ type: 'header', key: `H-${k}`, dateIso: rows[0].created_at });
      for (const r of rows) items.push({ type: 'row', key: `R-${r.id}`, record: r });
    }
    return items;
  }, [filteredRecords]);

  function handleDelete(id) {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            if (!USE_MOCK) await deleteRecord(id);
            setRecords((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert('오류', '삭제에 실패했어요.');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    if (item.type === 'header') {
      return (
        <View style={styles.dayHeaderRow}>
          <Text style={styles.dayHeaderText}>{formatDayHeader(item.dateIso)}</Text>
          <View style={styles.dayHeaderLine} />
        </View>
      );
    }
    const r = item.record;
    const color = CATEGORY_COLORS[r.category] || CATEGORY_COLORS['일상기록'];
    const icon = CATEGORY_ICONS[r.category] || 'reader-outline';
    const chips = buildChips(r.category, r.detail);

    return (
      <View style={styles.row}>
        <Text style={styles.rowTime}>{formatTime(r.created_at)}</Text>
        <View style={[styles.rowIcon, { backgroundColor: color.bg }]}>
          <Ionicons name={icon} size={14} color={color.ink} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTopLine}>
            <Text style={[styles.rowCategory, { color: color.ink }]}>
              {r.category.replace('기록', '')}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(r.id)} hitSlop={8}>
              <Ionicons name="close" size={14} color={C.inkMute} />
            </TouchableOpacity>
          </View>
          <Text style={styles.rowSummary}>{r.summary}</Text>
          {chips.length > 0 && (
            <View style={styles.chipRow}>
              {chips.map((chip, idx) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="기록"
        subtitle={`${records.length}건${query ? ` · ${filteredRecords.length}건 일치` : ''}`}
        onBack={() => navigation.goBack()}
        rightIcon={searchOpen ? 'close' : 'search-outline'}
        onRight={() => {
          if (searchOpen) {
            setSearchOpen(false);
            setQuery('');
          } else {
            setSearchOpen(true);
          }
        }}
      />

      {searchOpen && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.inkMute} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="요약·원문·카테고리에서 검색"
            placeholderTextColor={C.inkMute}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={C.inkMute} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Category tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            const label = cat === '전체' ? '전체' : cat.replace('기록', '');
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={[styles.tab, active && styles.tabActive]}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.ink} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="reader-outline" size={32} color={C.inkMute} />
          </View>
          <Text style={styles.emptyText}>아직 기록이 없어요</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('RecordInput')}
          >
            <Ionicons name="add" size={16} color={C.forestInk} />
            <Text style={styles.emptyBtnText}>첫 기록 입력하기</Text>
          </TouchableOpacity>
        </View>
      ) : query && filteredRecords.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={28} color={C.inkMute} />
          </View>
          <Text style={styles.emptyText}>"{query}" 검색 결과가 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomTabBar navigation={navigation} current="RecordList" />
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 8, marginTop: 4,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: {
    flex: 1, fontSize: 13, color: C.ink, fontWeight: '600',
    padding: 0,
  },

  tabsWrap: { paddingBottom: 8 },
  tabContent: { paddingHorizontal: 20, gap: 6 },
  tab: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: C.cardSoft, borderWidth: 1, borderColor: 'transparent',
  },
  tabActive: { backgroundColor: C.ink, borderColor: C.ink },
  tabText: { fontSize: 12, color: C.inkSoft, fontWeight: '700' },
  tabTextActive: { color: C.bg, fontWeight: '800' },

  list: { paddingHorizontal: 20, paddingBottom: 24 },

  dayHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 18, marginBottom: 8, gap: 10,
  },
  dayHeaderText: { fontSize: 11, color: C.inkSoft, fontWeight: '800', letterSpacing: 0.4 },
  dayHeaderLine: { flex: 1, height: 1, backgroundColor: C.borderSoft },

  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, gap: 12,
  },
  rowTime: { width: 38, fontSize: 11, color: C.inkSoft, fontWeight: '700', marginTop: 2 },
  rowIcon: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  rowBody: {
    flex: 1, backgroundColor: C.card, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: C.border,
  },
  rowTopLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  rowCategory: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  rowSummary: { fontSize: 14, fontWeight: '700', color: C.ink, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    backgroundColor: C.cardSoft, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.borderSoft,
  },
  chipText: { fontSize: 11, color: C.ink, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 14, color: C.inkSoft, fontWeight: '600' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.forest, borderRadius: 999,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  emptyBtnText: { color: C.forestInk, fontSize: 13, fontWeight: '800' },
});
