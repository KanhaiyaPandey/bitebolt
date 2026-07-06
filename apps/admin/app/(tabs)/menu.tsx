import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoriesApi, foodsApi } from '@/api';
import { CategoryRow } from '@/components/menu/CategoryRow';
import { FoodItemRow } from '@/components/menu/FoodItemRow';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useDebounce } from '@/hooks/useDebounce';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILL_WIDTH = (SCREEN_WIDTH - 32 - 8) / 2;

type Tab = 'foods' | 'categories';

function SegmentedControl({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const translateX = useSharedValue(active === 'foods' ? 0 : 1);

  function press(t: Tab) {
    translateX.value = withTiming(t === 'foods' ? 0 : 1, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    onChange(t);
  }

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * PILL_WIDTH }],
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#EEEEF5',
        borderRadius: 999,
        padding: 4,
        marginHorizontal: 16,
        marginBottom: 12,
        height: 44,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            width: PILL_WIDTH,
            backgroundColor: '#FA7938',
            borderRadius: 999,
            shadowColor: '#FA7938',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          },
          pillStyle,
        ]}
      />
      {(['foods', 'categories'] as Tab[]).map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => press(t)}
          activeOpacity={0.9}
          style={{ flex: 1, paddingVertical: 8, alignItems: 'center' }}
        >
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 13,
              color: active === t ? '#FFFFFF' : '#9098B1',
            }}
          >
            {t === 'foods' ? 'Food Items' : 'Categories'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('foods');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: 'food' | 'category';
  } | null>(null);

  const {
    data: foodsData,
    isLoading: loadingFoods,
    refetch: refetchFoods,
    isRefetching: refetchingFoods,
  } = useQuery({
    queryKey: ['admin-foods', { search: debouncedSearch }],
    queryFn: () => foodsApi.getAll({ search: debouncedSearch || undefined, page: 1, limit: 100 }),
    enabled: tab === 'foods',
    staleTime: 60_000,
  });

  const {
    data: categoriesData,
    isLoading: loadingCategories,
    refetch: refetchCategories,
    isRefetching: refetchingCategories,
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.getAll,
    enabled: tab === 'categories',
    staleTime: 60_000,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => {
      console.debug('[AdminMenu] Toggle availability', { foodItemId: id, isAvailable: value });
      return foodsApi.toggleAvailability(id, value);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-foods'] }),
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      categoriesApi.update(id, { isActive: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const deleteFoodMutation = useMutation({
    mutationFn: (id: string) => foodsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-foods'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      console.error('[AdminMenu] Delete food item failed', { id: deleteTarget?.id, error: err });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      console.error('[AdminMenu] Delete category failed', { id: deleteTarget?.id, error: err });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const foods: any[] = Array.isArray(foodsData) ? foodsData : ((foodsData as any)?.items ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : ((categoriesData as any)?.items ?? categoriesData ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 12,
          paddingBottom: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F8',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Ionicons
            name="restaurant-outline"
            size={22}
            color="#FA7938"
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>Menu</Text>
        </View>
        <SegmentedControl
          active={tab}
          onChange={(t) => {
            setTab(t);
            setSearch('');
          }}
        />
      </View>

      {/* Search + list */}
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: 12 }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'foods' ? 'Search food items…' : 'Search categories…'}
          />
        </View>

        {tab === 'foods' ? (
          loadingFoods ? (
            <View>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : (
            <FlatList
              data={foods}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <FoodItemRow
                  item={item}
                  index={index}
                  onToggleAvailability={(id, value) =>
                    toggleAvailabilityMutation.mutate({ id, value })
                  }
                  onDelete={(id, name) => setDeleteTarget({ id, name, type: 'food' })}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 180 }}
              ListEmptyComponent={
                <EmptyState
                  icon="restaurant-outline"
                  title="No food items"
                  subtitle="Tap + to add your first food item"
                />
              }
              refreshControl={
                <RefreshControl
                  refreshing={refetchingFoods}
                  onRefresh={refetchFoods}
                  tintColor="#FA7938"
                  colors={['#FA7938']}
                />
              }
            />
          )
        ) : loadingCategories ? (
          <View>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <CategoryRow
                item={item}
                index={index}
                onToggleActive={(id, value) => toggleCategoryMutation.mutate({ id, value })}
                onDelete={(id, name) => setDeleteTarget({ id, name, type: 'category' })}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 180 }}
            ListEmptyComponent={
              <EmptyState
                icon="grid-outline"
                title="No categories"
                subtitle="Tap + to add your first category"
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={refetchingCategories}
                onRefresh={refetchCategories}
                tintColor="#FA7938"
                colors={['#FA7938']}
              />
            }
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push(tab === 'foods' ? '/food/new' : '/category/new')}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: 110,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#FA7938',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#FA7938',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Confirm delete sheet */}
      {deleteTarget && (
        <ConfirmSheet
          visible={!!deleteTarget}
          title={`Delete ${deleteTarget.type === 'food' ? 'Food Item' : 'Category'}?`}
          message={`"${deleteTarget.name}" will be permanently removed.`}
          confirmLabel="Delete"
          loading={deleteFoodMutation.isPending || deleteCategoryMutation.isPending}
          onConfirm={() => {
            if (deleteTarget.type === 'food') deleteFoodMutation.mutate(deleteTarget.id);
            else deleteCategoryMutation.mutate(deleteTarget.id);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
