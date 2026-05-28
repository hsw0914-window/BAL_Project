import { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useBaby } from '../BabyContext';

const GENDERS = [
  { key: '여아', label: '여아', icon: 'female-outline' },
  { key: '남아', label: '남아', icon: 'male-outline' },
];

function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export default function BabyProfileModal({ visible, baby, onClose, onSave }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { addBaby, editBaby } = useBaby();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('여아');
  const [birth, setBirth] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!baby?.id;

  useEffect(() => {
    if (!visible) return;
    setName(baby?.name || '');
    setGender(baby?.gender || '여아');
    setBirth(baby?.birth_date || '');
    setSaving(false);
  }, [visible, baby]);

  const dateValid = !birth || isValidDate(birth);
  const canSave = !saving && dateValid;

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { name: name.trim() || null, gender, birth_date: birth.trim() || null };
      if (isEdit) {
        await editBaby(baby.id, payload);
      } else {
        await addBaby(payload);
      }
      if (onSave) await onSave(payload);
      onClose();
    } catch (e) {
      setSaving(false);
      alert(e?.response?.data?.detail || e?.message || '저장에 실패했어요.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headRow}>
            <Text style={styles.title}>아기 정보</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={C.inkSoft} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>이름·성별·생년월일을 입력하면 홈에 표시돼요</Text>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* 이름 */}
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="우리아가"
              placeholderTextColor={C.inkMute}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />

            {/* 성별 */}
            <Text style={styles.label}>성별</Text>
            <View style={styles.toggleRow}>
              {GENDERS.map((g) => {
                const active = gender === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGender(g.key)}
                    style={[styles.toggle, active && styles.toggleActive]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={g.icon}
                      size={16}
                      color={active ? C.bg : C.ink}
                    />
                    <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 생년월일 */}
            <Text style={styles.label}>생년월일</Text>
            <TextInput
              style={[
                styles.input,
                !dateValid && styles.inputError,
              ]}
              placeholder="YYYY-MM-DD (예: 2025-12-19)"
              placeholderTextColor={C.inkMute}
              value={birth}
              onChangeText={setBirth}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoCorrect={false}
            />
            {!dateValid && (
              <Text style={styles.errorText}>형식이 올바르지 않아요. 예: 2025-12-19</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.btnGhostText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, !canSave && styles.btnPrimaryDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color={C.bg} size="small" />
                : <Text style={styles.btnPrimaryText}>저장</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C) => StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(20,19,17,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 2, backgroundColor: C.border, marginBottom: 14,
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: C.inkSoft, marginTop: 2, marginBottom: 12 },

  body: { paddingTop: 4, paddingBottom: 12 },

  label: {
    fontSize: 11, color: C.inkSoft, fontWeight: '800',
    letterSpacing: 0.4, marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.ink,
  },
  inputError: { borderColor: C.roseInk },
  errorText: { fontSize: 11, color: C.roseInk, marginTop: 4 },

  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
  },
  toggleActive: { backgroundColor: C.ink, borderColor: C.ink },
  toggleText: { fontSize: 13, color: C.ink, fontWeight: '700' },
  toggleTextActive: { color: C.bg, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnGhost: {
    flex: 1, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1.5, borderColor: C.ink,
  },
  btnGhostText: { color: C.ink, fontWeight: '800', fontSize: 14 },
  btnPrimary: {
    flex: 1, backgroundColor: C.ink, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: C.bg, fontWeight: '800', fontSize: 14 },
});
