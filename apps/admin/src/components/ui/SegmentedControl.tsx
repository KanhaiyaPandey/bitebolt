import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { color, motion, press, space, text, ui } from '@/theme';

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: [Segment<T>, Segment<T>];
  value: T;
  onChange: (value: T) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
// Track spans the screen minus the horizontal gutters (space[4] * 2);
// each pill is half the inner track minus the track padding (space[1] * 2).
const PILL_WIDTH = (SCREEN_WIDTH - space[4] * 2 - space[1] * 2) / 2;

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const activeIndex = value === segments[0].value ? 0 : 1;
  const translateX = useSharedValue(activeIndex);

  function press_(v: T, index: number) {
    translateX.value = withTiming(index, {
      duration: motion.press,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    onChange(v);
  }

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * PILL_WIDTH }],
  }));

  return (
    <View style={ui.segmentTrack}>
      <Animated.View style={[ui.segmentPill, { width: PILL_WIDTH }, pillStyle]} />
      {segments.map((seg, i) => (
        <TouchableOpacity
          key={seg.value}
          onPress={() => press_(seg.value, i)}
          activeOpacity={press.primary}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: space[2],
          }}
        >
          <Text
            style={[
              text.label,
              { color: value === seg.value ? color.onBrand : color.textSecondary },
            ]}
          >
            {seg.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
