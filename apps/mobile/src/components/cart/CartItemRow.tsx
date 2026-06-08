import type { CartItem } from '@bitebolt/types';
import { formatCurrency } from '@bitebolt/utils';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function CartItemRow({ item, onIncrement, onDecrement }: CartItemRowProps) {
  const food = item.foodItem!;
  const price = food.discountedPrice ? Number(food.discountedPrice) : Number(food.price);

  return (
    <View className="flex-row items-center bg-surface-card dark:bg-surface-card-dark rounded-card p-3 mb-3">
      <Image
        source={{ uri: food.imageUrl ?? 'https://placehold.co/60' }}
        className="w-16 h-16 rounded-xl"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text
          className="font-semibold text-text-primary dark:text-text-primary-dark text-sm"
          numberOfLines={1}
        >
          {food.name}
        </Text>
        {item.specialInstructions && (
          <Text className="text-text-muted text-xs mt-0.5" numberOfLines={1}>
            Note: {item.specialInstructions}
          </Text>
        )}
        <Text className="font-bold text-text-primary dark:text-text-primary-dark mt-1">
          {formatCurrency(price * item.quantity)}
        </Text>
      </View>

      {/* Quantity control */}
      <View className="flex-row items-center bg-brand/10 rounded-pill px-1 py-1 gap-2">
        <TouchableOpacity
          onPress={onDecrement}
          className="w-7 h-7 bg-brand rounded-full items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base leading-none">−</Text>
        </TouchableOpacity>
        <Text className="text-brand font-bold w-4 text-center">{item.quantity}</Text>
        <TouchableOpacity
          onPress={onIncrement}
          className="w-7 h-7 bg-brand rounded-full items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base leading-none">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
