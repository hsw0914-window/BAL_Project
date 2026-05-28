import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

// 납작한 타원형 토글 — 좌측 ☀ / 우측 ☾, 활성 쪽이 ink 채움
export default function DarkModeToggle() {
  const { C, dark, toggle } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.7}
      style={[
        styles.pill,
        {
          backgroundColor: C.cardSoft,
          borderColor: C.border,
        },
      ]}
      hitSlop={6}
    >
      {/* 라이트 칸 */}
      <View
        style={[
          styles.cell,
          !dark && { backgroundColor: C.ink },
        ]}
      >
        <Ionicons
          name="sunny"
          size={13}
          color={!dark ? C.bg : C.inkMute}
        />
      </View>

      {/* 다크 칸 */}
      <View
        style={[
          styles.cell,
          dark && { backgroundColor: C.ink },
        ]}
      >
        <Ionicons
          name="moon"
          size={13}
          color={dark ? C.bg : C.inkMute}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cell: {
    width: 30,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
