import {
  View, Text, Image, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMaskedImageUrl } from '../services/api';
import { useTheme } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const TYPE_META = {
  prescription:        { label: '처방전',     icon: 'medkit-outline' },
  vaccination:         { label: '예방접종',   icon: 'shield-checkmark-outline' },
  medical_certificate: { label: '진료확인서', icon: 'document-text-outline' },
  unknown:             { label: '미분류',     icon: 'help-circle-outline' },
};

const KEY_LABELS = {
  summary: '요약',
  institution_name: '기관',
  vaccines: '백신',
  vaccination_dates: '접종일',
  hospital_name: '병원',
  department: '진료과',
  visit_date: '내원일',
  purpose: '용도',
  medicines: '약 정보',
  notes: '참고사항',
  preview_lines: '미리보기',
  name: '이름',
  date: '날짜',
  dose: '용량',
  frequency: '횟수',
  duration: '기간',
  method: '방법',
};

function prettifyKey(key) {
  return KEY_LABELS[key] || key;
}

export default function ResultScreen({ navigation, route }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { result } = route.params;
  const {
    detected = [],
    document_type = 'unknown',
    extracted = {},
    masked_image_url,
  } = result;

  const meta = TYPE_META[document_type] || TYPE_META.unknown;
  const imageUrl = getMaskedImageUrl(masked_image_url);
  const detectedTypes = [...new Set(detected.map((d) => d.type))];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="분석 결과"
        onBack={() => navigation.goBack()}
        rightIcon="share-outline"
        onRight={() => {}}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO — 문서 종류 */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={meta.icon} size={22} color={C.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>분류된 문서</Text>
            <Text style={styles.heroTitle}>{meta.label}</Text>
          </View>
          <View style={styles.heroPill}>
            <Ionicons name="checkmark" size={12} color={C.mintInk} />
            <Text style={styles.heroPillText}>분석 완료</Text>
          </View>
        </View>

        {/* 마스킹 이미지 */}
        <Text style={styles.sectionTitle}>마스킹 이미지</Text>
        <View style={styles.imageCard}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.documentImage}
            resizeMode="contain"
          />
          <Text style={styles.imageCaption}>민감정보는 검은 박스로 가려졌어요</Text>
        </View>

        {/* 추출된 데이터 */}
        <Text style={styles.sectionTitle}>추출된 데이터</Text>
        <StructuredDataView styles={styles} data={extracted} />

        {/* 마스킹된 항목 */}
        {detectedTypes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>마스킹된 항목</Text>
            <View style={styles.tagWrap}>
              {detectedTypes.map((type) => (
                <View key={type} style={styles.tag}>
                  <Ionicons name="lock-closed" size={10} color={C.roseInk} />
                  <Text style={styles.tagText}>{type}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* 액션 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.btnGhostText}>홈으로</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={16} color={C.forestInk} />
          <Text style={styles.btnPrimaryText}>다시 촬영</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StructuredDataView({ styles, data }) {
  const entries = Object.entries(data || {}).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });

  if (entries.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>추출된 데이터가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.dataList}>
      {entries.map(([key, value], i) => (
        <View
          key={key}
          style={[
            styles.dataRow,
            i < entries.length - 1 && styles.dataRowBorder,
          ]}
        >
          <Text style={styles.dataKey}>{prettifyKey(key)}</Text>
          <RenderValue styles={styles} value={value} />
        </View>
      ))}
    </View>
  );
}

function RenderValue({ styles, value }) {
  if (Array.isArray(value)) {
    return (
      <View style={{ gap: 6 }}>
        {value.map((item, idx) => (
          <View key={idx} style={styles.arrayItem}>
            {typeof item === 'object' && item !== null ? (
              Object.entries(item).map(([sk, sv]) => (
                <View key={sk} style={styles.subRow}>
                  <Text style={styles.subKey}>{prettifyKey(sk)}</Text>
                  <Text style={styles.subVal}>{String(sv || '-')}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.dataValue}>{String(item)}</Text>
            )}
          </View>
        ))}
      </View>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <View>
        {Object.entries(value).map(([sk, sv]) => (
          <View key={sk} style={styles.subRow}>
            <Text style={styles.subKey}>{prettifyKey(sk)}</Text>
            <Text style={styles.subVal}>{String(sv || '-')}</Text>
          </View>
        ))}
      </View>
    );
  }

  return <Text style={styles.dataValue}>{String(value)}</Text>;
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  // hero
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border,
  },
  heroIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  heroEyebrow: { fontSize: 10, color: C.inkSoft, fontWeight: '700', letterSpacing: 0.6 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: C.ink, marginTop: 2, letterSpacing: -0.3 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 999, backgroundColor: C.mintBg,
  },
  heroPillText: { fontSize: 10, color: C.mintInk, fontWeight: '800' },

  sectionTitle: {
    fontSize: 12, fontWeight: '900', color: C.ink,
    marginTop: 22, marginBottom: 10, letterSpacing: 0.4,
  },

  // 이미지 카드
  imageCard: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: C.border,
  },
  documentImage: {
    width: '100%', height: 320, borderRadius: 10,
    backgroundColor: C.cardSoft,
  },
  imageCaption: {
    fontSize: 11, color: C.inkMute, fontWeight: '500',
    marginTop: 8, textAlign: 'center',
  },

  // 데이터 리스트
  dataList: {
    backgroundColor: C.card, borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border,
  },
  dataRow: { paddingVertical: 12 },
  dataRowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  dataKey: {
    fontSize: 11, color: C.inkSoft, fontWeight: '800',
    marginBottom: 4, letterSpacing: 0.3,
  },
  dataValue: { fontSize: 14, color: C.ink, fontWeight: '600', lineHeight: 21 },

  arrayItem: {
    backgroundColor: C.cardSoft, borderRadius: 10,
    padding: 10,
    borderWidth: 1, borderColor: C.borderSoft,
  },
  subRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 3,
  },
  subKey: { fontSize: 11, color: C.inkSoft, fontWeight: '700' },
  subVal: { fontSize: 12, color: C.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  emptyCard: {
    backgroundColor: C.cardSoft, borderRadius: 12,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: C.borderSoft,
  },
  emptyText: { fontSize: 13, color: C.inkMute },

  // 태그
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.roseBg, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  tagText: { fontSize: 11, color: C.roseInk, fontWeight: '800' },

  // 하단 액션
  bottomBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  btnGhost: {
    flex: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.ink,
  },
  btnGhostText: { color: C.ink, fontWeight: '800', fontSize: 14 },
  btnPrimary: {
    flex: 1, flexDirection: 'row', gap: 8,
    backgroundColor: C.forest, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: C.forestInk, fontWeight: '800', fontSize: 14 },
});
