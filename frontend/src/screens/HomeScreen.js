import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MENU_ITEMS = [
  {
    label: '육아 기록 입력',
    description: '오늘 있었던 육아 내용을 텍스트로 기록해요',
    emoji: '📝',
    screen: 'RecordInput',
    color: '#EFF6FF',
    accent: '#3B82F6',
  },
  {
    label: '기록 목록 보기',
    description: '카테고리별로 저장된 기록을 확인해요',
    emoji: '📋',
    screen: 'RecordList',
    color: '#F0FDF4',
    accent: '#22C55E',
  },
  {
    label: '리포트',
    description: '수유량, 수면 패턴, 성장 곡선을 확인해요',
    emoji: '📊',
    screen: 'Report',
    color: '#F5F3FF',
    accent: '#7C3AED',
  },
  {
    label: '서류 촬영',
    description: '병원 서류를 촬영해 OCR로 분석해요',
    emoji: '📷',
    screen: 'Camera',
    color: '#FFF7ED',
    accent: '#F97316',
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BabyAutoLog</Text>
          <Text style={styles.subtitle}>아기의 하루를 기록해요</Text>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.card, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, { color: item.accent }]}>{item.label}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, padding: 24 },

  header: { marginTop: 16, marginBottom: 36 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },

  menuList: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  cardEmoji: { fontSize: 36 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
});
