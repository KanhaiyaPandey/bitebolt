import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { customersApi } from '@/api';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { color, elevation, layout, press, radius, space, text, ui } from '@/theme';

function formatDate(dt: string | Date) {
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Small metadata row (icon + muted label) inside the profile card.
function MetaRow({
  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[1.5] }}>
      <Ionicons
        name={icon}
        size={15}
        color={color.textSecondary}
        style={{ marginRight: space[2] }}
      />
      <Text style={[text.label, { color: color.textSecondary }]}>{children}</Text>
    </View>
  );
}

const miniCard = [
  {
    backgroundColor: color.surface,
    marginHorizontal: layout.screenX,
    borderRadius: radius.button,
    padding: space[3],
    marginBottom: space[2],
  },
  elevation.sm,
];

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
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <ScreenHeader title="Customer" showBack />
        <SkeletonCard height={120} />
        <SkeletonCard height={100} />
        <SkeletonCard height={200} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <ScreenHeader title="Customer" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[text.body, { color: color.textSecondary }]}>Customer not found</Text>
        </View>
      </View>
    );
  }

  const initials = (customer.name ?? customer.phone ?? '?').slice(0, 2).toUpperCase();
  const addresses = customer.addresses ?? [];
  const orders = customer.orders ?? [];
  const wallet = customer.wallet;
  const activeTone = customer.isActive
    ? { bg: color.success + '22', text: color.success }
    : { bg: color.error + '22', text: color.error };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScreenHeader title="Customer Detail" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: space[8] }}>
        {/* Profile card */}
        <View
          style={[
            {
              backgroundColor: color.surface,
              marginHorizontal: layout.screenX,
              marginTop: space[4],
              borderRadius: radius.card,
              padding: space[4],
            },
            elevation.sm,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[3] }}>
            <View style={[ui.iconTile(56, color.brandSubtle), { marginRight: space[3.5] }]}>
              <Text style={[text.h2, { color: color.brand }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[text.titleMd, { color: color.textPrimary }]}>
                {customer.name ?? '—'}
              </Text>
              <Text style={[text.label, { color: color.textSecondary, marginTop: space[0.5] }]}>
                {customer.phone}
              </Text>
            </View>
            <View style={ui.badge(activeTone.bg)}>
              <Text style={[text.captionStrong, { color: activeTone.text }]}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {customer.email && <MetaRow icon="mail-outline">{customer.email}</MetaRow>}
          <MetaRow icon="calendar-outline">Joined {formatDate(customer.createdAt)}</MetaRow>
          {wallet && (
            <MetaRow icon="wallet-outline">
              Wallet: ₹{Number(wallet.balance ?? 0).toFixed(2)}
            </MetaRow>
          )}
        </View>

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <>
            <SectionHeader title={`Saved Addresses (${addresses.length})`} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {addresses.map((addr: any) => (
              <View key={addr.id} style={miniCard}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[1] }}
                >
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={color.brand}
                    style={{ marginRight: space[1.5] }}
                  />
                  <Text style={[text.label, { color: color.textPrimary, flex: 1 }]}>
                    {addr.label ?? 'Address'}
                  </Text>
                  {addr.isDefault && (
                    <View style={[ui.badge(color.brandSubtle), { paddingVertical: space[0.5] }]}>
                      <Text style={[text.tiny, { color: color.brand }]}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={[text.caption, { color: color.textSecondary, lineHeight: 18 }]}>
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
            style={[
              text.body,
              { color: color.textSecondary, textAlign: 'center', paddingVertical: space[4] },
            ]}
          >
            No orders yet
          </Text>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push(`/order/${order.id}`)}
              activeOpacity={press.card}
              style={[miniCard, { flexDirection: 'row', alignItems: 'center' }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[text.label, { color: color.textPrimary }]}>#{order.orderNumber}</Text>
                <Text style={[text.caption, { color: color.textSecondary, marginTop: space[0.5] }]}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              <Text style={[text.bodyStrong, { color: color.brand, marginRight: space[2.5] }]}>
                ₹{Number(order.total).toFixed(2)}
              </Text>
              <StatusBadge status={order.status} size="sm" />
              <Ionicons
                name="chevron-forward"
                size={14}
                color={color.textMuted}
                style={{ marginLeft: space[2] }}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
