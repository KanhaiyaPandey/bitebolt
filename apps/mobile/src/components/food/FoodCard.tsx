import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { cartApi } from '../../api';
import { formatCurrency } from '@bitebolt/utils';
import type { FoodItem } from '@bitebolt/types';

interface FoodCardProps {
  item: FoodItem;
  onPress: () => void;
}

export function FoodCard({ item, onPress }: FoodCardProps) {
  const queryClient = useQueryClient();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const addMutation = useMutation({
    mutationFn: () => cartApi.addItem({ foodItemId: item.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Toast.show({ type: 'success', text1: 'Added to cart!', text2: item.name, visibilityTime: 1500 });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Could not add item' }),
  });

  const handleAdd = () => {
    scale.value = withSpring(0.95, {}, () => { scale.value = withSpring(1); });
    addMutation.mutate();
  };

  const effectivePrice = item.discountedPrice ? Number(item.discountedPrice) : Number(item.price);
  const hasDiscount = item.discountedPrice && Number(item.discountedPrice) < Number(item.price);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View className="bg-surface-card dark:bg-surface-card-dark rounded-card overflow-hidden flex-row">
        {/* Image */}
        <View className="relative">
          <Image
            source={{ uri: item.imageUrl ?? 'https://placehold.co/120x120' }}
            className="w-28 h-28"
            resizeMode="cover"
          />
          {hasDiscount && (
            <View className="absolute top-2 left-2 bg-success rounded-pill px-1.5 py-0.5">
              <Text className="text-white text-[9px] font-bold">
                {Math.round((1 - effectivePrice / Number(item.price)) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 p-3 justify-between">
          <View>
            {/* Veg/Non-veg indicator */}
            <View
              className={`w-4 h-4 border-2 rounded-sm items-center justify-center mb-1 ${
                item.isVeg ? 'border-success' : 'border-error'
              }`}
            >
              <View
                className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-success' : 'bg-error'}`}
              />
            </View>

            <Text className="font-semibold text-text-primary dark:text-text-primary-dark text-sm mb-0.5" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-text-muted text-xs" numberOfLines={2}>
              {item.description}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View>
              <Text className="font-bold text-text-primary dark:text-text-primary-dark">
                {formatCurrency(effectivePrice)}
              </Text>
              {hasDiscount && (
                <Text className="text-text-muted text-xs line-through">
                  {formatCurrency(Number(item.price))}
                </Text>
              )}
            </View>

            <Animated.View style={animatedStyle}>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={addMutation.isPending}
                className="bg-brand rounded-lg px-3 py-1.5"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-sm">+ ADD</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
