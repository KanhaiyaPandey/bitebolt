import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, foodsApi } from '../../src/api';
import { useAuthStore } from '../../src/store/auth.store';
import { FoodCardGrid } from '../../src/components/food/FoodCardGrid';
import { CategoryChip } from '../../src/components/food/CategoryChip';
import { FilterModal, EMPTY_FILTERS } from '../../src/components/FilterModal';
import type { FilterState } from '../../src/components/FilterModal';
import type { FoodItem, Category } from '@bitebolt/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // ── Search state ────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 350);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // ── Filter state ────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);

  const activeFilterCount = [filters.categoryId, filters.isVeg !== null ? true : null, filters.minRating]
    .filter(Boolean).length;

  const isSearchMode = !!debouncedSearch || !!(filters.categoryId) || filters.isVeg !== null || !!(filters.minRating);

  // ── Data queries ────────────────────────────────────────
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
    enabled: !isSearchMode,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['foods', 'search', debouncedSearch, filters.categoryId, filters.isVeg],
    queryFn: () =>
      foodsApi.getAll({
        search: debouncedSearch || undefined,
        categoryId: filters.categoryId ?? undefined,
        isVeg: filters.isVeg ?? undefined,
        limit: 40,
      }),
    enabled: isSearchMode,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  // ── Derived display items (client-side minRating filter) ─
  const displayItems = useMemo<FoodItem[]>(() => {
    const raw = isSearchMode
      ? ((searchData as { items: FoodItem[] } | undefined)?.items ?? [])
      : ((featuredData as FoodItem[] | undefined) ?? []);

    if (!filters.minRating) return raw;
    return raw.filter((item) => Number(item.rating) >= filters.minRating!);
  }, [isSearchMode, searchData, featuredData, filters.minRating]);

  const isLoading = isSearchMode ? searchLoading : loadingFeatured;

  const handleCategoryPress = (catId: string) => {
    setFilters(f => ({ ...f, categoryId: f.categoryId === catId ? null : catId }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
              Good {greeting()},
            </Text>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', marginTop: 2 }}>
              {user?.name?.split(' ')[0] ?? 'Foodie'} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#414158" />
          </TouchableOpacity>
        </View>

        {/* ── Search bar ──────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#FFFFFF', borderRadius: 14,
            paddingHorizontal: 14, paddingVertical: 12,
            shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}>
            <Ionicons name="search-outline" size={20} color="#9098B1" />
            <TextInput
              style={{ flex: 1, fontFamily: 'Urbanist', fontSize: 14, color: '#414158', marginLeft: 10 }}
              placeholder="Search food, drinks..."
              placeholderTextColor="#9098B1"
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { handleSearchChange(''); setDebouncedSearch(''); }}>
                <Ionicons name="close-circle" size={18} color="#C4C9D4" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter button */}
          <TouchableOpacity
            onPress={() => setShowFilter(true)}
            activeOpacity={0.8}
            style={{
              width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              backgroundColor: activeFilterCount > 0 ? '#FA7938' : '#414158',
              shadowColor: activeFilterCount > 0 ? '#FA7938' : '#1A1A2E',
              shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
            }}
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
            {activeFilterCount > 0 && (
              <View style={{
                position: 'absolute', top: -4, right: -4,
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#FA7938',
              }}>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 9, color: '#FA7938' }}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Active filter pills ──────────────────────────── */}
        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
          >
            {filters.categoryId && (
              <ActiveFilterPill
                label={(categories as Category[] | undefined)?.find(c => c.id === filters.categoryId)?.name ?? 'Category'}
                onRemove={() => setFilters(f => ({ ...f, categoryId: null }))}
              />
            )}
            {filters.isVeg !== null && (
              <ActiveFilterPill
                label={filters.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}
                onRemove={() => setFilters(f => ({ ...f, isVeg: null }))}
              />
            )}
            {filters.minRating !== null && (
              <ActiveFilterPill
                label={`★ ${filters.minRating}+`}
                onRemove={() => setFilters(f => ({ ...f, minRating: null }))}
              />
            )}
          </ScrollView>
        )}

        {/* ── Categories ──────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
          style={{ marginBottom: 16 }}
        >
          {loadingCats
            ? Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ width: 72, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', opacity: 0.5 }} />
              ))
            : (categories as Category[] | undefined)?.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  category={cat}
                  selected={filters.categoryId === cat.id}
                  onPress={() => handleCategoryPress(cat.id)}
                />
              ))}
        </ScrollView>

        {/* ── Section header ───────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 17, color: '#414158' }}>
            {isSearchMode ? 'Results' : '⭐ Featured'}
          </Text>
          {isSearchMode && !isLoading && (
            <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
              {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* ── Food grid ───────────────────────────────────── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <GridSkeleton key={i} width={CARD_WIDTH} />)
            : displayItems.length === 0 && isSearchMode
              ? (
                <View style={{ flex: 1, alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
                  <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#414158', textAlign: 'center', marginBottom: 6 }}>
                    No results found
                  </Text>
                  <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', textAlign: 'center' }}>
                    Try different keywords or adjust your filters
                  </Text>
                </View>
              )
              : displayItems.map((item) => (
                  <FoodCardGrid
                    key={item.id}
                    item={item}
                    width={CARD_WIDTH}
                    onPress={() => router.push(`/food/${item.slug}`)}
                  />
                ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Filter modal ────────────────────────────────────── */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        categories={(categories as Category[] | undefined) ?? []}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────

function ActiveFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#FA793820', borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: '#FA793840',
    }}>
      <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 12, color: '#FA7938' }}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
        <Ionicons name="close" size={13} color="#FA7938" />
      </TouchableOpacity>
    </View>
  );
}

function GridSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width, height: 210, borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden', opacity: 0.6 }}>
      <View style={{ height: 120, backgroundColor: '#E8E8F0' }} />
      <View style={{ padding: 10, gap: 6 }}>
        <View style={{ height: 12, width: '70%', borderRadius: 6, backgroundColor: '#E8E8F0' }} />
        <View style={{ height: 10, width: '50%', borderRadius: 6, backgroundColor: '#E8E8F0' }} />
        <View style={{ height: 10, width: '40%', borderRadius: 6, backgroundColor: '#E8E8F0' }} />
      </View>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
