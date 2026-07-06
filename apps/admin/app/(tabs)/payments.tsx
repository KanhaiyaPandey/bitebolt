import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { paymentsAdminApi, walletAdminApi } from '@/api';
import { PaymentRow } from '@/components/payments/PaymentRow';
import { WalletTxRow } from '@/components/payments/WalletTxRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { color, layout, press, space, text, ui } from '@/theme';

type Tab = 'payments' | 'wallet';

const PAYMENT_STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Captured', value: 'CAPTURED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const WALLET_TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Debit', value: 'DEBIT' },
];

export default function PaymentsScreen() {
  const [tab, setTab] = useState<Tab>('payments');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [walletType, setWalletType] = useState('');
  const insets = useSafeAreaInsets();

  const {
    data: paymentsData,
    isLoading: loadingPayments,
    refetch: refetchPayments,
    isRefetching: refetchingPayments,
  } = useQuery({
    queryKey: ['admin-payments', { status: paymentStatus }],
    queryFn: () => {
      console.debug('[AdminPayments] Fetching payments', { status: paymentStatus });
      return paymentsAdminApi.getAll({ status: paymentStatus || undefined, page: 1, limit: 50 });
    },
    staleTime: 30_000,
    enabled: tab === 'payments',
  });

  const {
    data: walletData,
    isLoading: loadingWallet,
    refetch: refetchWallet,
    isRefetching: refetchingWallet,
  } = useQuery({
    queryKey: ['admin-wallet-transactions', { type: walletType }],
    queryFn: () => {
      console.debug('[AdminPayments] Fetching wallet transactions', { type: walletType });
      return walletAdminApi.getTransactions({ type: walletType || undefined, page: 1, limit: 50 });
    },
    staleTime: 30_000,
    enabled: tab === 'wallet',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments: any[] = Array.isArray(paymentsData)
    ? paymentsData
    : ((paymentsData as any)?.payments ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletTxns: any[] = Array.isArray(walletData)
    ? walletData
    : ((walletData as any)?.transactions ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: color.surface,
          paddingTop: insets.top + space[3],
          borderBottomWidth: 1,
          borderBottomColor: color.borderSubtle,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: layout.screenX,
            marginBottom: space[3],
          }}
        >
          <Ionicons
            name="card-outline"
            size={22}
            color={color.brand}
            style={{ marginRight: space[2] }}
          />
          <Text style={[text.h2, { color: color.textPrimary }]}>Payments</Text>
        </View>
        <SegmentedControl<Tab>
          segments={[
            { value: 'payments', label: 'Payments' },
            { value: 'wallet', label: 'Wallet Txns' },
          ]}
          value={tab}
          onChange={(t) => {
            setTab(t);
            setPaymentStatus('');
            setWalletType('');
          }}
        />
      </View>

      {/* Filter chips */}
      <View style={{ backgroundColor: color.surface, paddingVertical: space[2.5] }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.screenX, gap: space[2] }}
        >
          {(tab === 'payments' ? PAYMENT_STATUS_FILTERS : WALLET_TYPE_FILTERS).map((f) => {
            const active = tab === 'payments' ? paymentStatus === f.value : walletType === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() =>
                  tab === 'payments' ? setPaymentStatus(f.value) : setWalletType(f.value)
                }
                activeOpacity={press.secondary}
                style={ui.chip(active)}
              >
                <Text style={[text.label, { color: active ? color.onBrand : color.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {tab === 'payments' ? (
        loadingPayments ? (
          <View style={{ paddingTop: space[3] }}>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} height={120} />
            ))}
          </View>
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <PaymentRow item={item} index={index} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: space[3], paddingBottom: layout.listBottomInset }}
            ListEmptyComponent={
              <EmptyState
                icon="card-outline"
                title="No payments yet"
                subtitle="Payments will show up once orders are placed"
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={refetchingPayments}
                onRefresh={refetchPayments}
                tintColor={color.brand}
                colors={[color.brand]}
              />
            }
          />
        )
      ) : loadingWallet ? (
        <View style={{ paddingTop: space[3] }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} height={80} />
          ))}
        </View>
      ) : (
        <FlatList
          data={walletTxns}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <WalletTxRow item={item} index={index} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: space[3], paddingBottom: layout.listBottomInset }}
          ListEmptyComponent={
            <EmptyState
              icon="wallet-outline"
              title="No wallet transactions"
              subtitle="Transactions will appear here once customers use their wallets"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refetchingWallet}
              onRefresh={refetchWallet}
              tintColor={color.brand}
              colors={[color.brand]}
            />
          }
        />
      )}
    </View>
  );
}
