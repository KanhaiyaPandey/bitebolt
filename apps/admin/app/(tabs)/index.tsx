import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, TouchableOpacity, Alert, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analyticsApi } from '@/api';
import { MetricCard } from '@/components/analytics/MetricCard';
import { PopularItems } from '@/components/analytics/PopularItems';
import { SalesChart } from '@/components/analytics/SalesChart';
import { STATUS_STYLES } from '@/components/orders/StatusBadge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useAdminAuthStore } from '@/store/auth.store';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: 'UPI',
  CARD: 'Card',
  NET_BANKING: 'Net Banking',
  WALLET: 'Wallet',
  COD: 'Cash on Delivery',
};

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateString() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAdminAuthStore((s) => s.user);
  const logout = useAdminAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: analyticsApi.getOverview,
    refetchInterval: 60_000,
  });

  const { data: dailySales, isLoading: loadingSales } = useQuery({
    queryKey: ['admin-analytics-daily-sales', 7],
    queryFn: () => analyticsApi.getDailySales(7),
    refetchInterval: 300_000,
  });

  const { data: popularItems, isLoading: loadingPopular } = useQuery({
    queryKey: ['admin-analytics-popular-items'],
    queryFn: () => analyticsApi.getPopularItems(5),
    refetchInterval: 300_000,
  });

  const { data: orderStats, isLoading: loadingOrderStats } = useQuery({
    queryKey: ['admin-analytics-order-stats'],
    queryFn: analyticsApi.getOrderStats,
    refetchInterval: 60_000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Modern Header Area */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 24,
            paddingHorizontal: 15,
            backgroundColor: '#FA7938',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            shadowColor: '#FA7938',
            shadowOpacity: 0.15,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
            marginBottom: 24,
          }}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                marginRight: 12,
              }}
            >
              <Image
                source={require('../../assets/images/logo.jpg')}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF' }}
              />
              <View>
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.85)',
                    marginBottom: 2,
                  }}
                >
                  {getGreeting()},
                </Text>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 24, color: '#FFFFFF' }}>
                  {user?.name ?? 'Admin'}
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(100).duration(600).springify()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="calendar-clear-outline" size={16} color="#FFF" />
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 14, color: '#FFFFFF' }}>
                  {getDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.8}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Overview metrics */}
        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
          <SectionHeader title="Today's Overview" />

          {loadingOverview ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
              <SkeletonCard height={140} width={160} />
              <SkeletonCard height={140} width={160} />
              <SkeletonCard height={140} width={160} />
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 4 }}
            >
              <MetricCard
                label="Orders Today"
                value={String(overview?.ordersToday ?? 0)}
                icon="receipt-outline"
                color="#FA7938"
              />
              <MetricCard
                label="Revenue Today"
                value={formatCurrency(overview?.revenueToday ?? 0)}
                icon="cash-outline"
                color="#10B981"
              />
              <MetricCard
                label="Total Revenue"
                value={formatCurrency(overview?.totalRevenue ?? 0)}
                icon="trending-up-outline"
                color="#808AFF"
              />
              <MetricCard
                label="Pending Orders"
                value={String(overview?.pendingOrders ?? 0)}
                icon="time-outline"
                color="#F59E0B"
              />
            </ScrollView>
          )}
        </Animated.View>

        {/* Daily Sales Chart */}
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
          <SectionHeader title="Revenue Insights" />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 24,
              borderRadius: 24,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
              marginBottom: 16,
            }}
          >
            {loadingSales || !dailySales ? (
              <SkeletonCard height={160} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <SalesChart data={dailySales} />
              </ScrollView>
            )}
          </View>
        </Animated.View>

        {/* Popular Items */}
        <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
          <SectionHeader title="Trending Items" />
          <View style={{ paddingHorizontal: 24 }}>
            {loadingPopular ? (
              <>
                <SkeletonCard height={72} />
                <SkeletonCard height={72} />
                <SkeletonCard height={72} />
              </>
            ) : popularItems && popularItems.length > 0 ? (
              <PopularItems items={popularItems} />
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: 40,
                  backgroundColor: '#FFF',
                  borderRadius: 24,
                }}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={48}
                  color="#D3D6DE"
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontFamily: 'Urbanist-Medium',
                    fontSize: 16,
                    color: '#9098B1',
                    textAlign: 'center',
                  }}
                >
                  No trending items yet
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Order Statistics */}
        <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
          <SectionHeader title="Order Statistics" />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              marginHorizontal: 24,
              borderRadius: 24,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
              marginBottom: 16,
            }}
          >
            {loadingOrderStats || !orderStats ? (
              <SkeletonCard height={120} />
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 13,
                    color: '#9098B1',
                    marginBottom: 10,
                  }}
                >
                  By Status
                </Text>
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {Object.entries(orderStats.byStatus ?? {}).map(([status, count]) => {
                    const style = STATUS_STYLES[status] ?? {
                      bg: '#F3F4F6',
                      text: '#374151',
                      label: status,
                    };
                    return (
                      <View
                        key={status}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: style.bg,
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Urbanist-SemiBold',
                              fontSize: 12,
                              color: style.text,
                            }}
                          >
                            {style.label}
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: 'Urbanist-Bold', fontSize: 14, color: '#414158' }}
                        >
                          {String(count)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 13,
                    color: '#9098B1',
                    marginBottom: 10,
                  }}
                >
                  By Payment Method
                </Text>
                <View style={{ gap: 8 }}>
                  {Object.entries(orderStats.byPaymentMethod ?? {}).map(([method, count]) => (
                    <View
                      key={method}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{ fontFamily: 'Urbanist-Medium', fontSize: 13, color: '#414158' }}
                      >
                        {PAYMENT_METHOD_LABELS[method] ?? method}
                      </Text>
                      <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 14, color: '#414158' }}>
                        {String(count)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
