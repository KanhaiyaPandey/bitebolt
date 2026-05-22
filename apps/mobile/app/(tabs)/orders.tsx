import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ordersApi } from '../../src/api';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@bitebolt/utils';
import type { Order } from '@bitebolt/types';

export default function OrdersScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getOrders({ page: 1, limit: 20 }) as Promise<{ orders: Order[] }>,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-surface-dark">
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (!data?.orders.length) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark items-center justify-center px-6" edges={['top']}>
        <Text className="text-6xl mb-4">📦</Text>
        <Text className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">No orders yet</Text>
        <Text className="text-text-secondary text-center mb-6">
          Your order history will appear here
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} className="bg-brand rounded-button px-8 py-3">
          <Text className="text-white font-semibold">Order Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">My Orders</Text>
      </View>
      <FlatList
        data={data.orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.85}
              className="bg-surface-card dark:bg-surface-card-dark rounded-card p-4 mb-3"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-bold text-text-primary dark:text-text-primary-dark">
                  {item.orderNumber}
                </Text>
                <View
                  className="px-2 py-1 rounded-pill"
                  style={{ backgroundColor: getOrderStatusColor(item.status) + '20' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getOrderStatusColor(item.status) }}
                  >
                    {getOrderStatusLabel(item.status)}
                  </Text>
                </View>
              </View>

              <Text className="text-text-secondary text-sm mb-1">
                {item.items.slice(0, 2).map((i) => i.name).join(', ')}
                {item.items.length > 2 ? ` +${item.items.length - 2} more` : ''}
              </Text>

              <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <Text className="text-text-muted text-xs">{formatDateTime(item.createdAt)}</Text>
                <Text className="font-bold text-text-primary dark:text-text-primary-dark">
                  {formatCurrency(Number(item.total))}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
