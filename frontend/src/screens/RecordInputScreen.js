import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createRecord } from '../services/api';
import { useTheme, CATEGORY_ICONS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const EXAMPLES = [
  '오전 10시 분유 150ml',
  '낮잠 1시간 30분',
  '체온 38.2도, 타이레놀 5ml',
  '대변 봤음',
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

export default function RecordInputScreen({ navigation }) {
  const { C, CATEGORY_COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
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

  function appendExample(ex) {
    setText((prev) => (prev.trim() ? `${prev.trim()}\n${ex}` : ex));
  }

  const canSubmit = !!text.trim() && !loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="기록 입력"
        subtitle="자유롭게 적으면 AI가 카테고리로 분류해요"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* AI 안내 카드 */}
        <View style={styles.aiHint}>
          <View style={styles.aiHintIcon}>
            <Ionicons name="sparkles" size={14} color={C.amberInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiHintTitle}>AI 자동 분류</Text>
            <Text style={styles.aiHintSub}>
              한 문장에 여러 일을 적어도 카테고리별로 나눠 저장됩니다
            </Text>
          </View>
        </View>

        {/* 입력창 */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>오늘의 기록</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder={
              '예시) 오전 10시에 분유 180ml 먹였고, 낮잠을 두 시간 잤어.\n오후에 체온이 37.8도라 병원 다녀왔음.'
            }
            placeholderTextColor={C.inkMute}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          <View style={styles.inputFootRow}>
            {text.length > 0 ? (
              <TouchableOpacity onPress={() => setText('')} hitSlop={6}>
                <Text style={styles.clearText}>지우기</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <Text style={styles.charCount}>{text.length}자</Text>
          </View>
        </View>

        {/* 빠른 예시 */}
        <Text style={styles.sectionTitle}>빠른 예시</Text>
        <View style={styles.exampleRow}>
          {EXAMPLES.map((ex) => (
            <TouchableOpacity
              key={ex}
              style={styles.exampleChip}
              onPress={() => appendExample(ex)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={12} color={C.inkSoft} />
              <Text style={styles.exampleChipText}>{ex}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 제출 버튼 (고정) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.submitInner}>
              <ActivityIndicator color={C.forestInk} size="small" />
              <Text style={styles.submitText}>분석 중...</Text>
            </View>
          ) : (
            <View style={styles.submitInner}>
              <Ionicons name="sparkles" size={16} color={C.forestInk} />
              <Text style={styles.submitText}>AI 분류 후 저장</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 결과 모달 */}
      <Modal visible={!!results} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeadRow}>
              <View style={styles.modalCheck}>
                <Ionicons name="checkmark" size={18} color={C.forestInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>저장 완료</Text>
                <Text style={styles.modalSubtitle}>
                  {results?.length}개 카테고리로 분류되어 저장됐어요
                </Text>
              </View>
            </View>

            <ScrollView style={styles.resultList} showsVerticalScrollIndicator={false}>
              {results?.map((item) => {
                const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['일상기록'];
                const icon = CATEGORY_ICONS[item.category] || 'reader-outline';
                const chips = buildChips(item.category, item.detail);
                return (
                  <View key={item.id} style={styles.resultCard}>
                    <View style={styles.resultTopRow}>
                      <View style={[styles.resultBadge, { backgroundColor: color.bg }]}>
                        <Ionicons name={icon} size={12} color={color.ink} />
                        <Text style={[styles.resultBadgeText, { color: color.ink }]}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.resultSummary}>{item.summary}</Text>
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
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnOutline}
                onPress={() => { setResults(null); navigation.navigate('RecordList'); }}
              >
                <Text style={styles.modalBtnOutlineText}>목록 보기</Text>
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

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  // AI 안내 카드
  aiHint: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: C.amberBg, marginBottom: 18,
  },
  aiHintIcon: {
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiHintTitle: { fontSize: 13, fontWeight: '900', color: C.amberInk, letterSpacing: -0.2 },
  aiHintSub: { fontSize: 11, color: C.amberInk, marginTop: 2, opacity: 0.85 },

  // 입력창
  inputWrap: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  inputLabel: {
    fontSize: 11, fontWeight: '800', color: C.inkSoft,
    letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    minHeight: 160, fontSize: 14, color: C.ink, lineHeight: 22, padding: 0,
  },
  inputFootRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.borderSoft,
  },
  clearText: { fontSize: 11, color: C.inkSoft, fontWeight: '700' },
  charCount: { fontSize: 11, color: C.inkMute },

  // 빠른 예시
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: C.ink,
    marginTop: 22, marginBottom: 10, letterSpacing: 0.3,
  },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exampleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  exampleChipText: { fontSize: 12, color: C.ink, fontWeight: '600' },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  submitBtn: {
    backgroundColor: C.forest, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: C.inkMute, opacity: 0.5 },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: C.forestInk, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  // 모달
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(20,19,17,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8,
    maxHeight: '78%',
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 2, backgroundColor: C.border, marginBottom: 14,
  },
  modalHeadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  modalCheck: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 12, color: C.inkSoft, marginTop: 2 },

  resultList: { marginBottom: 16 },
  resultCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  resultTopRow: { flexDirection: 'row', marginBottom: 6 },
  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  },
  resultBadgeText: { fontSize: 11, fontWeight: '800' },
  resultSummary: { fontSize: 14, color: C.ink, fontWeight: '700', lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.cardSoft,
  },
  chipText: { fontSize: 11, color: C.ink, fontWeight: '700' },

  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtnOutline: {
    flex: 1, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.ink,
    paddingVertical: 13, alignItems: 'center',
  },
  modalBtnOutlineText: { color: C.ink, fontWeight: '800', fontSize: 13 },
  modalBtn: {
    flex: 1, backgroundColor: C.ink, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  modalBtnText: { color: C.bg, fontWeight: '800', fontSize: 13 },
});
