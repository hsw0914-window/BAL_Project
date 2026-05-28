import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';

// 깊은 밤하늘 네이비 — 라이트/다크 양쪽 다 통일된 브랜드 컬러
const NIGHT_SKY = '#1B2D4F';

// crescent + 작은 별자리: 모든 요소 동일 cream 톤 + 명확한 사이즈 계층 (달>큰별>작은별>점)
// 단색 통일 + 크기 차이로 콜라주가 아니라 "구성"으로 읽힘.
export default function BrandLogo({ size = 40 }) {
  const { C } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 11,
        backgroundColor: NIGHT_SKY,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 50 50">
        {/* 달 본체 (cream) */}
        <Circle cx="22" cy="25" r="15" fill={C.forestInk} />
        {/* bg 색 원으로 덮어서 crescent */}
        <Circle cx="31" cy="21" r="14" fill={NIGHT_SKY} />

        {/* 큰 4점 별 — 우상단 */}
        <Path
          d="M 40 11 L 41.2 14 L 44.2 15.2 L 41.2 16.4 L 40 19.4 L 38.8 16.4 L 35.8 15.2 L 38.8 14 Z"
          fill={C.forestInk}
        />
        {/* 작은 4점 별 — 우하단 */}
        <Path
          d="M 37 36 L 37.8 38 L 39.8 38.8 L 37.8 39.6 L 37 41.6 L 36.2 39.6 L 34.2 38.8 L 36.2 38 Z"
          fill={C.forestInk}
        />
        {/* 반짝임 점 — 큰별과 작은별 사이 */}
        <Circle cx="45" cy="27" r="1" fill={C.forestInk} />
        {/* 미니 점 — 큰별 위쪽 */}
        <Circle cx="33" cy="8" r="0.8" fill={C.forestInk} />
      </Svg>
    </View>
  );
}
