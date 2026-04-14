import {
  View, Text, Image, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMaskedImageUrl } from '../services/api';

export default function ResultScreen({ navigation, route }) {
  const { result } = route.params;
  const {
    detected = [],
    document_type = 'unknown',
    extracted = {},
    masked_image_url,
  } = result;

  const imageUrl = getMaskedImageUrl(masked_image_url);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Document Analysis</Text>
          <Text style={styles.subtitle}>Check the document type and extracted data.</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{getDocumentTypeLabel(document_type)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Masked Document</Text>
          <Image source={{ uri: imageUrl }} style={styles.documentImage} resizeMode="contain" />
          <Text style={styles.imageCaption}>Sensitive information is hidden with black boxes.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extracted Data</Text>
          <StructuredDataView data={extracted} />
        </View>

        {detected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Masked Fields</Text>
            <View style={styles.tagWrap}>
              {[...new Set(detected.map((item) => item.type))].map((type, idx) => (
                <View key={`${type}-${idx}`} style={styles.tag}>
                  <Text style={styles.tagText}>{type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.retakeBtnText}>Retake</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StructuredDataView({ data }) {
  const entries = Object.entries(data || {}).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });

  if (entries.length === 0) {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.emptyText}>No extracted data yet.</Text>
      </View>
    );
  }

  return (
    <View>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.infoCard}>
          <Text style={styles.infoKey}>{prettifyKey(key)}</Text>
          <RenderValue value={value} />
        </View>
      ))}
    </View>
  );
}

function RenderValue({ value }) {
  if (Array.isArray(value)) {
    return (
      <View>
        {value.map((item, idx) => (
          <View key={`${idx}-${JSON.stringify(item)}`} style={styles.arrayItem}>
            {typeof item === 'object' && item !== null ? (
              Object.entries(item).map(([subKey, subValue]) => (
                <Text key={subKey} style={styles.infoValue}>
                  {prettifyKey(subKey)}: {String(subValue || '-')}
                </Text>
              ))
            ) : (
              <Text style={styles.infoValue}>{String(item)}</Text>
            )}
          </View>
        ))}
      </View>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <View>
        {Object.entries(value).map(([subKey, subValue]) => (
          <Text key={subKey} style={styles.infoValue}>
            {prettifyKey(subKey)}: {String(subValue || '-')}
          </Text>
        ))}
      </View>
    );
  }

  return <Text style={styles.infoValue}>{String(value)}</Text>;
}

function getDocumentTypeLabel(type) {
  const labels = {
    prescription: 'Prescription',
    vaccination: 'Vaccination',
    medical_certificate: 'Medical Certificate',
    unknown: 'Unknown',
  };
  return labels[type] || type;
}

function prettifyKey(key) {
  const labels = {
    summary: 'Summary',
    institution_name: 'Institution',
    vaccines: 'Vaccines',
    vaccination_dates: 'Vaccination Dates',
    hospital_name: 'Hospital',
    department: 'Department',
    visit_date: 'Visit Date',
    purpose: 'Purpose',
    medicines: 'Medicines',
    notes: 'Notes',
    preview_lines: 'Preview',
    name: 'Name',
    date: 'Date',
    dose: 'Dose',
    frequency: 'Frequency',
    duration: 'Duration',
    method: 'Method',
  };
  return labels[key] || key;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B' },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  typeBadgeText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 12 },

  documentImage: {
    width: '100%',
    height: 320,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  imageCaption: { fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'center' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoKey: { fontSize: 13, color: '#64748B', marginBottom: 8, fontWeight: '700' },
  infoValue: { fontSize: 14, color: '#1E293B', lineHeight: 22 },
  arrayItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: '#64748B' },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tagText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },

  retakeBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
