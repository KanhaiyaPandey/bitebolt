import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoriesApi, foodsApi } from '@/api';
import { CategoryRow } from '@/components/menu/CategoryRow';
import { FoodItemRow } from '@/components/menu/FoodItemRow';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useDebounce } from '@/hooks/useDebounce';
import { color, layout, press, space, text, ui } from '@/theme';

type Tab = 'foods' | 'categories';

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
  const allCategories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : ((categoriesData as any)?.items ?? categoriesData ?? []);
  // categoriesApi.getAll ignores the search term, so filter client-side.
  const categories = debouncedSearch
    ? allCategories.filter((c) =>
        (c.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : allCategories;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: color.surface,
          paddingTop: insets.top + space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.borderSubtle,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: layout.screenX,
            marginBottom: space[3],
          }}
        >
          <Ionicons
            name="restaurant-outline"
            size={22}
            color={color.brand}
            style={{ marginRight: space[2] }}
          />
          <Text style={[text.h2, { color: color.textPrimary }]}>Menu</Text>
        </View>
        <SegmentedControl<Tab>
          segments={[
            { value: 'foods', label: 'Food Items' },
            { value: 'categories', label: 'Categories' },
          ]}
          value={tab}
          onChange={(t) => {
            setTab(t);
            setSearch('');
          }}
        />
      </View>

      {/* Search + list */}
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: space[3] }}>
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
                  tintColor={color.brand}
                  colors={[color.brand]}
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
                tintColor={color.brand}
                colors={[color.brand]}
              />
            }
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push(tab === 'foods' ? '/food/new' : '/category/new')}
        activeOpacity={press.card}
        style={ui.fab}
      >
        <Ionicons name="add" size={28} color={color.onBrand} />
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
