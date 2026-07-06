import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { color, motion, radius, space } from '@/theme';

export function SkeletonCard({
  height = 80,
  width,
  flex,
}: {
  height?: number;
  width?: number;
  flex?: number;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: motion.skeleton }),
        withTiming(1, { duration: motion.skeleton }),
      ),
      -1,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: color.borderStrong,
          borderRadius: radius.card,
          height,
          width,
          flex,
          marginHorizontal: width || flex ? 0 : space[4],
          marginBottom: space[3],
        },
        animStyle,
      ]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: space[3],
        marginHorizontal: space[4],
        marginBottom: space[3],
      }}
    >
      <SkeletonCard height={48} flex={1} />
      <SkeletonCard height={48} flex={1} />
    </View>
  );
}
