import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const TABS = [
  { label: '홈',     icon: 'home-outline',       iconActive: 'home',       screen: 'Home' },
  { label: '입력',   icon: 'create-outline',     iconActive: 'create',     screen: 'RecordInput' },
  { label: '목록',   icon: 'list-outline',       iconActive: 'list',       screen: 'RecordList' },
  { label: '리포트', icon: 'pie-chart-outline',  iconActive: 'pie-chart',  screen: 'Report' },
  { label: '촬영',   icon: 'scan-outline',       iconActive: 'scan',       screen: 'Camera' },
];

export default function BottomTabBar({ navigation, current }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  // 제스처 nav 폰은 inset.bottom 이 0~24, 3버튼 nav 는 ~48. 최소 28 보장 + inset 더함.
  const bottomPad = Math.max(28, insets.bottom + 14);
  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
      {TABS.map((t) => {
        const active = t.screen === current;
        return (
          <TouchableOpacity
            key={t.screen}
            activeOpacity={0.6}
            style={styles.tab}
            onPress={() => {
              if (active) return;
              navigation.navigate(t.screen);
            }}
          >
            <Ionicons
              name={active ? t.iconActive : t.icon}
              size={22}
              color={active ? C.ink : C.inkMute}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {active && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 6,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 4 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.inkMute, letterSpacing: 0.2 },
  tabLabelActive: { color: C.ink, fontWeight: '800' },
  activeDot: {
    position: 'absolute', top: 2, width: 4, height: 4,
    borderRadius: 2, backgroundColor: C.ink,
  },
});
