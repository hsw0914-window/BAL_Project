import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createRecord } from '../services/api';

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

export default function RecordInputScreen({ navigation }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const saved = await createRecord(text.trim());
      setResults(saved);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || '오류가 발생했습니다.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResults(null);
    setText('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>육아 기록 입력</Text>
          <Text style={styles.subtitle}>오늘 있었던 일을 자유롭게 적어주세요</Text>
        </View>

        {/* 입력창 */}
        <TextInput
          style={styles.input}
          multiline
          placeholder={
            '예시) 오전 10시에 분유 180ml 먹였고, 낮잠을 두 시간 잤어.\n오후에 체온이 37.8도라 병원 다녀왔음.'
          }
          placeholderTextColor="#94A3B8"
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>{text.length}자</Text>

        {/* 제출 버튼 */}
        <TouchableOpacity
          style={[styles.submitBtn, (!text.trim() || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>AI 분류 후 저장</Text>
          }
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>AI가 내용을 분석하고 있어요...</Text>
        )}
      </View>

      {/* 결과 모달 */}
      <Modal visible={!!results} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>저장 완료!</Text>
            <Text style={styles.modalSubtitle}>
              {results?.length}개 카테고리로 분류되어 저장됐어요
            </Text>

            <ScrollView style={styles.resultList} showsVerticalScrollIndicator={false}>
              {results?.map((item) => {
                const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['일상기록'];
                const chips = buildChips(item.category, item.detail);
                return (
                  <View key={item.id} style={[styles.resultCard, { backgroundColor: color.bg }]}>
                    <Text style={[styles.resultCategory, { color: color.text }]}>
                      {item.category}
                    </Text>
                    <Text style={styles.resultSummary}>{item.summary}</Text>
                    {chips.length > 0 && (
                      <View style={styles.chipRow}>
                        {chips.map((chip, idx) => (
                          <View key={idx} style={[styles.chip, { borderColor: color.text + '40' }]}>
                            <Text style={[styles.chipText, { color: color.text }]}>{chip}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnOutline}
                onPress={() => { setResults(null); navigation.navigate('RecordList'); }}
              >
                <Text style={styles.modalBtnOutlineText}>기록 목록 보기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={handleClose}>
                <Text style={styles.modalBtnText}>새 기록 입력</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, padding: 24 },

  header: { marginBottom: 20 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },

  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 24,
  },
  charCount: { textAlign: 'right', fontSize: 12, color: '#94A3B8', marginTop: 6 },

  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { backgroundColor: '#CBD5E1' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingHint: { textAlign: 'center', color: '#64748B', fontSize: 13, marginTop: 10 },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    maxHeight: '75%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },

  resultList: { marginBottom: 20 },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultCategory: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  resultSummary: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 12, fontWeight: '600' },

  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnOutline: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnOutlineText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  modalBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
