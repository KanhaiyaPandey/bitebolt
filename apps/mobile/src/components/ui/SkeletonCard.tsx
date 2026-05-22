import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useEffect,
} from 'react-native-reanimated';

function Shimmer({ className }: { className: string }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <View className="bg-surface-card dark:bg-surface-card-dark rounded-card overflow-hidden flex-row">
      <Shimmer className="w-28 h-28" />
      <View className="flex-1 p-3 justify-between">
        <View>
          <Shimmer className="h-4 w-3/4 mb-2" />
          <Shimmer className="h-3 w-full mb-1" />
          <Shimmer className="h-3 w-2/3" />
        </View>
        <View className="flex-row justify-between items-center mt-2">
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-7 w-16 rounded-lg" />
        </View>
      </View>
    </View>
  );
}
