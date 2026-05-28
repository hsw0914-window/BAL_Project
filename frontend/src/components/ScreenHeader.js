import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightLabel,
  rightIcon,
  onRight,
}) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconBtn}
            hitSlop={10}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {rightLabel || rightIcon ? (
          <TouchableOpacity
            onPress={onRight}
            style={styles.iconBtn}
            hitSlop={10}
            activeOpacity={0.6}
          >
            {rightIcon ? (
              <Ionicons name={rightIcon} size={20} color={C.ink} />
            ) : (
              <Text style={styles.rightLabel}>{rightLabel}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: C.inkSoft, textAlign: 'center', marginTop: 2 },
  rightLabel: { fontSize: 12, fontWeight: '700', color: C.ink },
});
