import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function SkeletonCard({ height = 80, width }: { height?: number; width?: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#E0E0EA',
          borderRadius: 16,
          height,
          width,
          marginHorizontal: width ? 0 : 16,
          marginBottom: 12,
        },
        animStyle,
      ]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 12 }}>
      <SkeletonCard height={48} />
      <SkeletonCard height={48} />
    </View>
  );
}
