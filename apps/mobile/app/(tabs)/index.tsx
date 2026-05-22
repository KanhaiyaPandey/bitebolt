import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { categoriesApi, foodsApi } from '../../src/api';
import { useAuthStore } from '../../src/store/auth.store';
import { FoodCard } from '../../src/components/food/FoodCard';
import { CategoryChip } from '../../src/components/food/CategoryChip';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import type { FoodItem, Category } from '@bitebolt/types';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const {
    data: categories,
    isLoading: loadingCats,
  } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });

  const {
    data: featuredData,
    isLoading: loadingFeatured,
    refetch,
    isRefetching,
  } = useQuery({ queryKey: ['foods', 'featured'], queryFn: foodsApi.getFeatured });

  const onRefresh = useCallback(() => { refetch(); }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={['#FF5722']} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} className="px-5 pt-4 pb-2">
          <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Foodie'} 👋
          </Text>
          <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold mt-0.5">
            What are you craving?
          </Text>
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="px-5 mb-5">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
            className="flex-row items-center bg-surface-card dark:bg-surface-card-dark rounded-xl px-4 py-3"
          >
            <Text className="text-lg mr-2">🔍</Text>
            <Text className="text-text-muted dark:text-text-secondary-dark text-sm">
              Search for dishes, cuisines...
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text className="px-5 text-lg font-bold text-text-primary dark:text-text-primary-dark mb-3">
            Categories
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {loadingCats
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} className="w-20 h-24 bg-gray-100 rounded-xl mr-3 animate-pulse" />
                ))
              : (categories as Category[] | undefined)?.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    category={cat}
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { categoryId: cat.id } })}
                  />
                ))}
          </ScrollView>
        </Animated.View>

        {/* Promo Banner */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="px-5 mt-6 mb-6">
          <View className="bg-brand rounded-card p-5 flex-row items-center">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">50% OFF</Text>
              <Text className="text-white/80 text-sm mt-0.5">On your first order!</Text>
              <TouchableOpacity className="bg-white rounded-pill px-4 py-1.5 mt-3 self-start">
                <Text className="text-brand font-semibold text-sm">Order Now</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-6xl">🎉</Text>
          </View>
        </Animated.View>

        {/* Featured / Bestsellers */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="px-5">
          <Text className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-3">
            🔥 Bestsellers
          </Text>
          {loadingFeatured ? (
            <View className="gap-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : (
            <View className="gap-4">
              {(featuredData as FoodItem[] | undefined)?.map((item, idx) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(idx * 50).springify()}>
                  <FoodCard
                    item={item}
                    onPress={() => router.push(`/food/${item.slug}`)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
