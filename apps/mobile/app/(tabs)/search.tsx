import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../src/api';
import type { Category } from '@bitebolt/types';

const CATEGORIES = [
  { key: 'meals',  label: 'Meals',  emoji: '🍕' },
  { key: 'shops',  label: 'Shops',  emoji: '🛍️' },
  { key: 'drugs',  label: 'Drugs',  emoji: '💊' },
  { key: 'drinks', label: 'Drinks', emoji: '🥤' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.categoryId ?? null,
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const allCategories = (categories as Category[] | undefined) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
            shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}
        >
          <Ionicons name="close" size={20} color="#414158" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>
          Filters
        </Text>
        <TouchableOpacity
          onPress={() => { setSelectedCategory(null); setMinPrice(''); setMaxPrice(''); }}
        >
          <Ionicons name="trash-outline" size={22} color="#9098B1" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Categories ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158', marginBottom: 16 }}>
            Categories
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {(allCategories.length > 0 ? allCategories.slice(0, 4) : CATEGORIES).map((cat) => {
              const key = 'key' in cat ? (cat as any).key : (cat as Category).id;
              const label = 'label' in cat ? (cat as any).label : (cat as Category).name;
              const emoji = 'emoji' in cat ? (cat as any).emoji : null;
              const catImageUrl = 'imageUrl' in cat ? (cat as Category).imageUrl : null;
              const isSelected = selectedCategory === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedCategory(isSelected ? null : key)}
                  style={{ alignItems: 'center', width: 72 }}
                >
                  <View style={{
                    width: 60, height: 60, borderRadius: 16,
                    backgroundColor: isSelected ? '#FA7938' : '#FFFFFF',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 6,
                    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0 : 0.06,
                    shadowRadius: 6, elevation: isSelected ? 0 : 2,
                  }}>
                    <Text style={{ fontSize: 26 }}>{emoji ?? '🍽️'}</Text>
                  </View>
                  <Text style={{
                    fontFamily: 'Urbanist-Medium', fontSize: 12,
                    color: isSelected ? '#FA7938' : '#414158', textAlign: 'center',
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Price Range ────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158', marginBottom: 16 }}>
            Price Range
          </Text>

          {/* Price bar visual */}
          <View style={{ height: 6, backgroundColor: '#D3D6DE', borderRadius: 3, marginBottom: 16, position: 'relative' }}>
            <View style={{
              position: 'absolute', left: '10%', right: '20%',
              top: 0, bottom: 0, backgroundColor: '#FA7938', borderRadius: 3,
            }} />
            {/* Min thumb */}
            <View style={{
              position: 'absolute', left: '10%', top: -7,
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FA7938',
            }} />
            {/* Max thumb */}
            <View style={{
              position: 'absolute', right: '20%', top: -7,
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FA7938',
            }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginBottom: 6 }}>$ Min</Text>
              <View style={{
                backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
              }}>
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#C4C9D4"
                  style={{ fontFamily: 'Urbanist-Medium', fontSize: 14, color: '#414158' }}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginBottom: 6 }}>$ Max</Text>
              <View style={{
                backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
              }}>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="decimal-pad"
                  placeholder="999"
                  placeholderTextColor="#C4C9D4"
                  style={{ fontFamily: 'Urbanist-Medium', fontSize: 14, color: '#414158' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Rating Filter ──────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158', marginBottom: 16 }}>
            Minimum Rating
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[3, 3.5, 4, 4.5].map((r) => (
              <TouchableOpacity
                key={r}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#FFFFFF', borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 10,
                  shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
                  gap: 4,
                }}
              >
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#414158' }}>
                  {r}+
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Apply button ───────────────────────────────────── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06, shadowRadius: 16, elevation: 8,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#FA7938', borderRadius: 14,
            paddingVertical: 16, alignItems: 'center',
            shadowColor: '#FA7938', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
          }}
        >
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
            Apply Filters
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
