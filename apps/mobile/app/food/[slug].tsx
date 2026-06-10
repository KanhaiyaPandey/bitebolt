import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { foodsApi, cartApi } from '../../src/api';
import { formatCurrency } from '@bitebolt/utils';
import type { FoodItem } from '@bitebolt/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DeliveryMode = 'delivery' | 'pickup';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery');
  const [quantity, setQuantity] = useState(1);
  const [isFavourite, setIsFavourite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { data: item, isLoading } = useQuery({
    queryKey: ['food', slug],
    queryFn: () => foodsApi.getBySlug(slug) as Promise<FoodItem>,
    enabled: !!slug,
  });

  const addMutation = useMutation({
    mutationFn: () => cartApi.addItem({ foodItemId: item!.id, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Toast.show({
        type: 'success',
        text1: 'Added to cart!',
        text2: item?.name,
        visibilityTime: 1500,
      });
      router.back();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Could not add item' }),
  });

  if (isLoading || !item) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#EEEEF5',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#FA793820',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="restaurant-outline" size={24} color="#FA7938" />
        </View>
      </View>
    );
  }

  const effectivePrice = item.discountedPrice ? Number(item.discountedPrice) : Number(item.price);
  const IMAGE_HEIGHT = SCREEN_WIDTH * 0.72;

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      {/* ── Hero image ───────────────────────────────────── */}
      <View style={{ height: IMAGE_HEIGHT }}>
        <Image
          source={{ uri: item.imageUrl ?? 'https://placehold.co/400x288/F5E6D3/FA7938?text=🍓' }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Overlay top bar */}
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#414158" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158' }}>
              Overview
            </Text>
            <TouchableOpacity
              onPress={() => setIsFavourite(!isFavourite)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Ionicons
                name={isFavourite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavourite ? '#EF4444' : '#414158'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Content card ─────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1, marginTop: -24 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
        >
          {/* Name + qty row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 22, color: '#414158' }}>
                {item.name}
              </Text>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginTop: 2 }}
              >
                By {item.category?.name ?? 'BiteBolt'}
              </Text>
            </View>
            {/* Qty control */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EEEEF5',
                borderRadius: 24,
                paddingHorizontal: 4,
                paddingVertical: 4,
                gap: 8,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: '#D3D6DE',
                }}
              >
                <Ionicons name="remove" size={16} color="#414158" />
              </TouchableOpacity>
              <Text
                style={{
                  fontFamily: 'Urbanist-Bold',
                  fontSize: 15,
                  color: '#414158',
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {quantity} kg
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#FA7938',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 20 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 16, color: '#414158' }}>
                  {item.rating ?? '4.96'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 3, gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(Number(item.rating ?? 5)) ? 'star' : 'star-outline'}
                    size={12}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>
            <View style={{ width: 1, height: 36, backgroundColor: '#EEEEF5' }} />
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
              <Text
                style={{
                  fontFamily: 'Urbanist-Medium',
                  fontSize: 11,
                  color: '#9098B1',
                  marginTop: 2,
                }}
              >
                All Time{'\n'}Favourite
              </Text>
            </View>
            <View style={{ width: 1, height: 36, backgroundColor: '#EEEEF5' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 16, color: '#414158' }}>
                {item.totalRatings ?? '298'}
              </Text>
              <Text
                style={{
                  fontFamily: 'Urbanist-Medium',
                  fontSize: 11,
                  color: '#9098B1',
                  marginTop: 2,
                }}
              >
                Reviews
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 16 }} />

          {/* Description */}
          <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', lineHeight: 22 }}>
            {item.description ??
              'Fresh and full of flavor, perfect for healthy snacking, desserts and refreshing recipes for daily enjoyment.'}
            {'  '}
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FA7938' }}>...See More</Text>
          </Text>

          {/* Delivery / Pickup toggle */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#EEEEF5',
              borderRadius: 14,
              padding: 4,
              marginTop: 20,
              gap: 4,
            }}
          >
            {(['delivery', 'pickup'] as DeliveryMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setDeliveryMode(mode)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: deliveryMode === mode ? '#414158' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 14,
                    color: deliveryMode === mode ? '#FFFFFF' : '#9098B1',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* You Might Like */}
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginTop: 24,
              marginBottom: 14,
            }}
          >
            You Might Like
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { emoji: '🍊', price: '₹3.00' },
              { emoji: '🍔', price: '₹5.50' },
            ].map((suggestion, i) => (
              <View
                key={i}
                style={{
                  width: 72,
                  alignItems: 'center',
                  backgroundColor: '#EEEEF5',
                  borderRadius: 14,
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 30 }}>{suggestion.emoji}</Text>
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 12,
                    color: '#414158',
                    marginTop: 4,
                  }}
                >
                  {suggestion.price}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed bottom bar ─────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 20,
          paddingVertical: 14,
          paddingBottom: 28,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <View>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>Price</Text>
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
            ₹{effectivePrice.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => addMutation.mutate()}
          disabled={addMutation.isPending}
          style={{
            flex: 1,
            backgroundColor: '#FA7938',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#FA7938',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
            Checkout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
