import { useState, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useBaby } from '../BabyContext';
import { formatBabyAge } from '../dataHelpers';

export default function BabySelectorModal({ visible, onClose, onAddBaby, onEditBaby }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { babies, activeBaby, setActiveBaby, removeBaby } = useBaby();

  function handleSelect(id) {
    setActiveBaby(id);
    onClose();
  }

  function handleDelete(baby) {
    Alert.alert('아기 삭제', `${baby.name || '이름없음'}의 모든 기록이 삭제됩니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => { await removeBaby(baby.id); },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headRow}>
            <Text style={styles.title}>아기 관리</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={C.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {babies.length === 0 ? (
              <Text style={styles.emptyText}>등록된 아기가 없어요</Text>
            ) : (
              babies.map((b) => {
                const isActive = activeBaby?.id === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.row, isActive && styles.rowActive]}
                    onPress={() => handleSelect(b.id)}
                    onLongPress={() => handleDelete(b)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowName}>{b.name || '이름없음'}</Text>
                      <Text style={styles.rowSub}>
                        {[b.gender, b.birth_date ? formatBabyAge(b.birth_date) : null].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <TouchableOpacity
                        onPress={() => { onClose(); setTimeout(() => onEditBaby(b), 200); }}
                        hitSlop={8}
                      >
                        <Ionicons name="pencil-outline" size={16} color={C.inkMute} />
                      </TouchableOpacity>
                      {isActive && (
                        <Ionicons name="checkmark-circle" size={18} color={C.forest} style={{ marginLeft: 10 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { onClose(); setTimeout(onAddBaby, 200); }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={C.forestInk} />
            <Text style={styles.addBtnText}>아기 추가</Text>
          </TouchableOpacity>
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
    maxHeight: '70%',
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

  body: { paddingBottom: 12 },
  emptyText: { fontSize: 13, color: C.inkMute, textAlign: 'center', paddingVertical: 28 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  rowActive: { borderColor: C.forest },
  rowLeft: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '800', color: C.ink },
  rowSub: { fontSize: 11, color: C.inkSoft, marginTop: 2, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.forest, borderRadius: 12,
    paddingVertical: 14, marginTop: 4,
  },
  addBtnText: { color: C.forestInk, fontWeight: '800', fontSize: 14 },
});
