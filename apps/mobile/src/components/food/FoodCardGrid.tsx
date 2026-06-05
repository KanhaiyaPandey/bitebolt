import { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { cartApi } from '../../api';
import { formatCurrency } from '@bitebolt/utils';
import type { FoodItem } from '@bitebolt/types';

interface FoodCardGridProps {
  item: FoodItem;
  width: number;
  onPress: () => void;
}

export function FoodCardGrid({ item, width, onPress }: FoodCardGridProps) {
  const queryClient = useQueryClient();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const addMutation = useMutation({
    mutationFn: () => cartApi.addItem({ foodItemId: item.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Toast.show({
        type: 'success',
        text1: 'Added to cart!',
        text2: item.name,
        visibilityTime: 1500,
      });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Could not add item' }),
  });

  const handleAdd = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    addMutation.mutate();
  };

  const effectivePrice = item.discountedPrice
    ? Number(item.discountedPrice)
    : Number(item.price);
  const hasDiscount =
    item.discountedPrice && Number(item.discountedPrice) < Number(item.price);

  const imageHeight = width * 0.78;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ width }}
    >
      <View
        style={{
          width,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {/* ── Product image ──────────────────────────── */}
        <View style={{ height: imageHeight, position: 'relative' }}>
          <Image
            source={{ uri: item.imageUrl ?? 'https://placehold.co/200x160/EEEEF5/9098B1?text=Food' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {hasDiscount && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: '#10B981',
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                {Math.round((1 - effectivePrice / Number(item.price)) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* ── Card content ───────────────────────────── */}
        <View style={{ padding: 10 }}>
          {/* Name */}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 14,
              color: '#414158',
            }}
          >
            {item.name}
          </Text>

          {/* Seller */}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Urbanist',
              fontSize: 11,
              color: '#9098B1',
              marginTop: 2,
            }}
          >
            By {item.restaurantName ?? item.categoryName ?? 'BiteBolt'}
          </Text>

          {/* Price row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: 'Urbanist-Bold',
                  fontSize: 14,
                  color: '#414158',
                }}
              >
                $ {effectivePrice.toFixed(2)}
              </Text>
              {hasDiscount && (
                <Text
                  style={{
                    fontFamily: 'Urbanist',
                    fontSize: 10,
                    color: '#C4C9D4',
                    textDecorationLine: 'line-through',
                  }}
                >
                  $ {Number(item.price).toFixed(2)}
                </Text>
              )}
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={addMutation.isPending}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FA7938',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FA7938',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
