import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { cartApi } from '../../src/api';
import { useCartStore } from '../../src/store/cart.store';
import { CartItemRow } from '../../src/components/cart/CartItemRow';
import { formatCurrency } from '@bitebolt/utils';
import type { Cart } from '@bitebolt/types';

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = await cartApi.getCart() as Cart;
      setCart(data);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.updateItem(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update cart' }),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-surface-dark">
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark items-center justify-center px-6">
        <Text className="text-6xl mb-4">🛒</Text>
        <Text className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          Your cart is empty
        </Text>
        <Text className="text-text-secondary text-center mb-6">
          Add some delicious items to get started!
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          className="bg-brand rounded-button px-8 py-3"
        >
          <Text className="text-white font-semibold">Browse Menu</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Your Cart</Text>
        <Text className="text-text-secondary text-sm mt-0.5">{cart.itemCount} items</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20 }}>
        {cart.items.map((item, idx) => (
          <Animated.View key={item.id} entering={FadeInDown.delay(idx * 40).springify()}>
            <CartItemRow
              item={item}
              onIncrement={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
              onDecrement={() => updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
            />
          </Animated.View>
        ))}

        {/* Bill Summary */}
        <View className="bg-surface-card dark:bg-surface-card-dark rounded-card p-4 mt-4 mb-6">
          <Text className="font-bold text-text-primary dark:text-text-primary-dark mb-3">Bill Details</Text>
          <BillRow label="Subtotal" value={formatCurrency(cart.subtotal)} />
          <BillRow label="Delivery fee" value={formatCurrency(cart.deliveryFee)} />
          <BillRow label="Taxes & fees (5%)" value={formatCurrency(cart.taxes)} />
          <View className="h-px bg-gray-200 my-3" />
          <BillRow label="Total" value={formatCurrency(cart.total)} bold />
        </View>
      </ScrollView>

      {/* Checkout CTA */}
      <View className="px-5 pb-6 pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => router.push('/checkout')}
          className="bg-brand rounded-button py-4 flex-row items-center justify-between px-6"
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold">{cart.itemCount} items</Text>
          <Text className="text-white font-bold text-base">Proceed to Checkout</Text>
          <Text className="text-white font-semibold">{formatCurrency(cart.total)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between mb-2">
      <Text className={`text-sm ${bold ? 'font-bold text-text-primary dark:text-text-primary-dark' : 'text-text-secondary'}`}>
        {label}
      </Text>
      <Text className={`text-sm ${bold ? 'font-bold text-text-primary dark:text-text-primary-dark' : 'text-text-secondary'}`}>
        {value}
      </Text>
    </View>
  );
}
