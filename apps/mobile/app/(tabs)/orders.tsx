import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi } from '../../src/api';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@bitebolt/utils';
import type { Order } from '@bitebolt/types';

const STATUS_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  pending:    'time-outline',
  confirmed:  'checkmark-circle-outline',
  preparing:  'restaurant-outline',
  dispatched: 'bicycle-outline',
  delivered:  'checkmark-done-circle-outline',
  cancelled:  'close-circle-outline',
};

export default function OrdersScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getOrders({ page: 1, limit: 20 }) as Promise<{ orders: Order[] }>,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEEF5' }}>
        <ActivityIndicator size="large" color="#FA7938" />
      </View>
    );
  }

  if (!data?.orders.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }} edges={['top']}>
        <View style={{
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: '#FA793820', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <Ionicons name="notifications-outline" size={46} color="#FA7938" />
        </View>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', marginBottom: 8 }}>
          No orders yet
        </Text>
        <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', textAlign: 'center', marginBottom: 28 }}>
          Your order history will appear here
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={{ backgroundColor: '#FA7938', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}
        >
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#fff', fontSize: 15 }}>Order Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 22, color: '#414158' }}>
          My Orders
        </Text>
      </View>

      <FlatList
        data={data.orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusColor = getOrderStatusColor(item.status);
          const statusIcon = STATUS_ICONS[item.status] ?? 'ellipsis-horizontal-circle-outline';

          return (
            <TouchableOpacity
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.9}
              style={{
                backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
                shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158' }}>
                  {item.orderNumber}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                  backgroundColor: statusColor + '18',
                }}>
                  <Ionicons name={statusIcon} size={13} color={statusColor} />
                  <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 12, color: statusColor }}>
                    {getOrderStatusLabel(item.status)}
                  </Text>
                </View>
              </View>

              <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginBottom: 10 }}>
                {item.items.slice(0, 2).map((i) => i.name).join(' · ')}
                {item.items.length > 2 ? ` +${item.items.length - 2} more` : ''}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#C4C9D4' }}>
                  {formatDateTime(item.createdAt)}
                </Text>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158' }}>
                  {formatCurrency(Number(item.total))}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
