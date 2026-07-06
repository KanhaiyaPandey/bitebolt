import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { customersApi } from '@/api';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

function formatDate(dt: string | Date) {
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => {
      console.debug('[AdminCustomers] Fetching customer detail', { customerId: id });
      return customersApi.getById(id!);
    },
    staleTime: 30_000,
    enabled: !!id,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer: any = Array.isArray(data) ? data[0] : data;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
        <ScreenHeader title="Customer" showBack />
        <SkeletonCard height={120} />
        <SkeletonCard height={100} />
        <SkeletonCard height={200} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
        <ScreenHeader title="Customer" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Urbanist', color: '#9098B1' }}>Customer not found</Text>
        </View>
      </View>
    );
  }

  const initials = (customer.name ?? customer.phone ?? '?').slice(0, 2).toUpperCase();
  const addresses = customer.addresses ?? [];
  const orders = customer.orders ?? [];
  const wallet = customer.wallet;

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <ScreenHeader title="Customer Detail" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FFF4EE',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#FA7938' }}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 16, color: '#414158' }}>
                {customer.name ?? '—'}
              </Text>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginTop: 2 }}
              >
                {customer.phone}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: customer.isActive ? '#D1FAE5' : '#FEE2E2',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 12,
                  color: customer.isActive ? '#065F46' : '#7F1D1D',
                }}
              >
                {customer.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {customer.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="mail-outline" size={15} color="#9098B1" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                {customer.email}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color="#9098B1"
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
              Joined {formatDate(customer.createdAt)}
            </Text>
          </View>

          {wallet && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="wallet-outline"
                size={15}
                color="#9098B1"
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                Wallet: ₹{Number(wallet.balance ?? 0).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <>
            <SectionHeader title={`Saved Addresses (${addresses.length})`} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {addresses.map((addr: any) => (
              <View
                key={addr.id}
                style={{
                  backgroundColor: '#FFF',
                  marginHorizontal: 16,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="#FA7938"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontFamily: 'Urbanist-SemiBold',
                      fontSize: 13,
                      color: '#414158',
                      flex: 1,
                    }}
                  >
                    {addr.label ?? 'Address'}
                  </Text>
                  {addr.isDefault && (
                    <View
                      style={{
                        backgroundColor: '#FFF4EE',
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 10, color: '#FA7938' }}
                      >
                        Default
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', lineHeight: 18 }}
                >
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  {`, ${addr.city}, ${addr.state} - ${addr.pincode}`}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Order History */}
        <SectionHeader title={`Order History (${orders.length})`} />
        {orders.length === 0 ? (
          <Text
            style={{
              fontFamily: 'Urbanist',
              fontSize: 14,
              color: '#9098B1',
              textAlign: 'center',
              paddingVertical: 16,
            }}
          >
            No orders yet
          </Text>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push(`/order/${order.id}`)}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#FFF',
                marginHorizontal: 16,
                borderRadius: 14,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#414158' }}>
                  #{order.orderNumber}
                </Text>
                <Text
                  style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginTop: 2 }}
                >
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Urbanist-Bold',
                  fontSize: 14,
                  color: '#FA7938',
                  marginRight: 10,
                }}
              >
                ₹{Number(order.total).toFixed(2)}
              </Text>
              <StatusBadge status={order.status} size="sm" />
              <Ionicons
                name="chevron-forward"
                size={14}
                color="#C4C9D4"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
