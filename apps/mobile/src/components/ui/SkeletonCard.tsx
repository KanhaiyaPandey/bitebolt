import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

function Shimmer({ className }: { className: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
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
