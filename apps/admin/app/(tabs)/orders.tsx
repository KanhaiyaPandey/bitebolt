import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ordersApi } from '@/api';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function OrdersScreen() {
  const [activeStatus, setActiveStatus] = useState('');
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-orders', { status: activeStatus }],
    queryFn: () => ordersApi.getAll({ status: activeStatus || undefined, page: 1, limit: 50 }),
    refetchInterval: 15_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => ordersApi.updateStatus(id, { status: 'ACCEPTED' }),
    onSuccess: (_, id) => {
      console.debug('[AdminOrders] Status updated', { orderId: id, newStatus: 'ACCEPTED' });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err, id) => {
      console.error('[AdminOrders] Failed to update status', { orderId: id, error: err });
    },
  });

  console.debug('[AdminOrders] Fetching orders', { status: activeStatus });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: any[] = Array.isArray(data) ? data : ((data as any)?.orders ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F8',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="receipt-outline" size={22} color="#FA7938" style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
            Orders
          </Text>
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
        >
          {STATUS_FILTERS.map((f) => {
            const active = activeStatus === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setActiveStatus(f.value)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: active ? '#FA7938' : '#F5F5FA',
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 13,
                    color: active ? '#FFFFFF' : '#9098B1',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ paddingTop: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} height={110} />
          ))}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OrderCard order={item} index={index} onAccept={(id) => acceptMutation.mutate(id)} />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              subtitle="New orders will appear here automatically"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FA7938"
              colors={['#FA7938']}
            />
          }
        />
      )}
    </View>
  );
}
