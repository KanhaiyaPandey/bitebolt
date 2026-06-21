import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { foodsApi, cartApi } from '../../src/api';
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

  const { data: item, isLoading } = useQuery({
    queryKey: ['food', slug],
    queryFn: () => foodsApi.getBySlug(slug),
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
        <ActivityIndicator size="large" color="#FA7938" />
      </View>
    );
  }

  const originalPrice = Number(item.price);
  const effectivePrice = item.discountedPrice ? Number(item.discountedPrice) : originalPrice;
  const hasDiscount = !!item.discountedPrice && effectivePrice < originalPrice;
  const IMAGE_HEIGHT = SCREEN_WIDTH * 0.78;

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      {/* ── Hero image ───────────────────────────────────── */}
      <View style={{ height: IMAGE_HEIGHT }}>
        <Image
          source={{ uri: item.imageUrl ?? 'https://placehold.co/400x312/F5E6D3/FA7938?text=🍽️' }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
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
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={20} color="#414158" />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => setIsFavourite(!isFavourite)} style={styles.iconBtn}>
              <Ionicons
                name={isFavourite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavourite ? '#EF4444' : '#414158'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Veg / Non-veg badge */}
        {item.isVeg !== undefined && (
          <View
            style={{
              position: 'absolute',
              bottom: 30,
              left: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: item.isVeg ? '#22C55E' : '#EF4444',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Ionicons
              name={item.isVeg ? 'leaf-outline' : 'restaurant-outline'}
              size={12}
              color="#fff"
            />
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 11, color: '#fff' }}>
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Content card ─────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1, marginTop: -28 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 24,
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
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 22, color: '#414158' }}>
                {item.name}
              </Text>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginTop: 3 }}
              >
                {item.category?.name ?? 'BiteBolt Kitchen'}
              </Text>
            </View>

            {/* Quantity stepper */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EEEEF5',
                borderRadius: 24,
                paddingHorizontal: 4,
                paddingVertical: 4,
                gap: 10,
                marginTop: 2,
              }}
            >
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
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
                  minWidth: 16,
                  textAlign: 'center',
                }}
              >
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FA7938',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating + stats row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 18,
              backgroundColor: '#FAFAFA',
              borderRadius: 16,
              padding: 14,
              gap: 0,
            }}
          >
            {/* Rating */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={15} color="#F59E0B" />
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 16, color: '#414158' }}>
                  {Number(item.rating ?? 4.9).toFixed(1)}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginTop: 3 }}
              >
                Rating
              </Text>
            </View>

            <View style={{ width: 1, height: 36, backgroundColor: '#EEEEF5' }} />

            {/* Reviews */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="chatbubble-outline" size={14} color="#9098B1" />
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 16, color: '#414158' }}>
                  {item.totalRatings ?? '298'}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginTop: 3 }}
              >
                Reviews
              </Text>
            </View>

            <View style={{ width: 1, height: 36, backgroundColor: '#EEEEF5' }} />

            {/* Delivery time */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={14} color="#9098B1" />
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 16, color: '#414158' }}>
                  25
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginTop: 3 }}
              >
                Min
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 18 }} />

          {/* Description */}
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 15,
              color: '#414158',
              marginBottom: 8,
            }}
          >
            About this item
          </Text>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', lineHeight: 22 }}>
            {item.description ??
              'Fresh and full of flavor, crafted with quality ingredients. Perfect for any time of the day — satisfying, delicious and made with care.'}
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
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons
                  name={mode === 'delivery' ? 'bicycle-outline' : 'storefront-outline'}
                  size={15}
                  color={deliveryMode === mode ? '#FFFFFF' : '#9098B1'}
                />
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

          {/* Nutritional tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {['Fresh', 'Hygienic', 'No Preservatives', 'Chef Special'].map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: '#FA793812',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: '#FA793830',
                }}
              >
                <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 12, color: '#FA7938' }}>
                  {tag}
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
          paddingTop: 14,
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
          <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>Total</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 22, color: '#414158' }}>
              ₹{(effectivePrice * quantity).toFixed(2)}
            </Text>
            {hasDiscount && (
              <Text
                style={{
                  fontFamily: 'Urbanist',
                  fontSize: 13,
                  color: '#C4C9D4',
                  textDecorationLine: 'line-through',
                }}
              >
                ₹{(originalPrice * quantity).toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => addMutation.mutate()}
          disabled={addMutation.isPending}
          style={{
            flex: 1,
            backgroundColor: addMutation.isPending ? '#F5A97A' : '#FA7938',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            shadowColor: '#FA7938',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {addMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
            {addMutation.isPending ? 'Adding…' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
};
