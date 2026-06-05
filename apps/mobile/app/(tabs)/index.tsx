import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, foodsApi } from '../../src/api';
import { useAuthStore } from '../../src/store/auth.store';
import { FoodCardGrid } from '../../src/components/food/FoodCardGrid';
import { CategoryChip } from '../../src/components/food/CategoryChip';
import type { FoodItem, Category } from '@bitebolt/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 cols with 16px side pads + 16px gap

const FILTER_TABS = ['FOR YOU', 'PICKUP', 'OFFERS'] as const;
type FilterTab = typeof FILTER_TABS[number];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<FilterTab>('FOR YOU');

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const {
    data: featuredData,
    isLoading: loadingFeatured,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['foods', 'featured'],
    queryFn: foodsApi.getFeatured,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const items = (featuredData as FoodItem[] | undefined) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={['#FA7938']}
            tintColor="#FA7938"
          />
        }
      >
        {/* ── Top bar ─────────────────────────────────────── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View>
            <Text className="text-text-secondary text-sm font-medium">
              Good {greeting()},
            </Text>
            <Text
              className="text-text-primary text-xl font-bold mt-0.5"
              style={{ fontFamily: 'Urbanist-Bold' }}
            >
              {user?.name?.split(' ')[0] ?? 'Foodie'} 👋
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
            style={{
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#414158" />
          </TouchableOpacity>
        </View>

        {/* ── Search bar ──────────────────────────────────── */}
        <View className="px-5 mb-5">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 13,
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Ionicons name="search-outline" size={20} color="#9098B1" />
            <Text
              className="flex-1 text-text-muted text-sm mx-3"
              style={{ fontFamily: 'Urbanist' }}
            >
              Search by name...
            </Text>
            <TouchableOpacity className="mr-3">
              <Ionicons name="camera-outline" size={20} color="#9098B1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#414158',
                borderRadius: 10,
                padding: 7,
              }}
            >
              <Ionicons name="options-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ── Categories ──────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          className="mb-5"
        >
          {loadingCats
            ? Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={{ width: 72, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', opacity: 0.5 }}
                />
              ))
            : (categories as Category[] | undefined)?.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  category={cat}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/search', params: { categoryId: cat.id } })
                  }
                />
              ))}
        </ScrollView>

        {/* ── Filter tabs ─────────────────────────────────── */}
        <View className="flex-row items-center px-5 mb-5 gap-2">
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 9999,
                backgroundColor: activeTab === tab ? '#414158' : '#FFFFFF',
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === tab ? 0 : 0.05,
                shadowRadius: 4,
                elevation: activeTab === tab ? 0 : 2,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: activeTab === tab ? '#FFFFFF' : '#9098B1',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Food grid ───────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 16,
            gap: 16,
          }}
        >
          {loadingFeatured
            ? Array.from({ length: 4 }).map((_, i) => (
                <GridSkeleton key={i} width={CARD_WIDTH} />
              ))
            : items.map((item) => (
                <FoodCardGrid
                  key={item.id}
                  item={item}
                  width={CARD_WIDTH}
                  onPress={() => router.push(`/food/${item.slug}`)}
                />
              ))}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers ─────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function GridSkeleton({ width }: { width: number }) {
  return (
    <View
      style={{
        width,
        height: 210,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        opacity: 0.6,
      }}
    >
      <View style={{ height: 120, backgroundColor: '#E8E8F0' }} />
      <View style={{ padding: 10, gap: 6 }}>
        <View style={{ height: 12, width: '70%', borderRadius: 6, backgroundColor: '#E8E8F0' }} />
        <View style={{ height: 10, width: '50%', borderRadius: 6, backgroundColor: '#E8E8F0' }} />
        <View style={{ height: 10, width: '40%', borderRadius: 6, backgroundColor: '#E8E8F0' }} />
      </View>
    </View>
  );
}
