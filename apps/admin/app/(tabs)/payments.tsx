import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { paymentsAdminApi, walletAdminApi } from '@/api';
import { PaymentRow } from '@/components/payments/PaymentRow';
import { WalletTxRow } from '@/components/payments/WalletTxRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Container takes full width minus horizontal margins (16 * 2)
const CONTAINER_WIDTH = SCREEN_WIDTH - 32;
// Pill takes half the container width minus the padding (4 * 2)
const PILL_WIDTH = (CONTAINER_WIDTH - 8) / 2;

function SegmentedControl({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const translateX = useSharedValue(active === 'payments' ? 0 : 1);

  function press(t: Tab) {
    translateX.value = withTiming(t === 'payments' ? 0 : 1, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // smooth ease out
    });
    onChange(t);
  }

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * PILL_WIDTH }],
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#EEEEF5',
        borderRadius: 999,
        padding: 4,
        marginHorizontal: 16,
        marginBottom: 12,
        height: 44,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            width: PILL_WIDTH,
            backgroundColor: '#FA7938',
            borderRadius: 999,
            shadowColor: '#FA7938',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          },
          pillStyle,
        ]}
      />
      {(['payments', 'wallet'] as Tab[]).map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => press(t)}
          activeOpacity={0.9}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 13,
              color: active === t ? '#FFFFFF' : '#9098B1',
            }}
          >
            {t === 'payments' ? 'Payments' : 'Wallet Txns'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

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
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 12,
          paddingBottom: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F8',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Ionicons name="card-outline" size={22} color="#FA7938" style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
            Payments
          </Text>
        </View>
        <SegmentedControl
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPaymentStatus('');
            setWalletType('');
          }}
        />
      </View>

      {/* Filter chips */}
      <View style={{ backgroundColor: '#FFF', paddingVertical: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {(tab === 'payments' ? PAYMENT_STATUS_FILTERS : WALLET_TYPE_FILTERS).map((f) => {
            const active = tab === 'payments' ? paymentStatus === f.value : walletType === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() =>
                  tab === 'payments' ? setPaymentStatus(f.value) : setWalletType(f.value)
                }
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

      {tab === 'payments' ? (
        loadingPayments ? (
          <View style={{ paddingTop: 12 }}>
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
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 110 }}
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
                tintColor="#FA7938"
                colors={['#FA7938']}
              />
            }
          />
        )
      ) : loadingWallet ? (
        <View style={{ paddingTop: 12 }}>
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
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 110 }}
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
              tintColor="#FA7938"
              colors={['#FA7938']}
            />
          }
        />
      )}
    </View>
  );
}
