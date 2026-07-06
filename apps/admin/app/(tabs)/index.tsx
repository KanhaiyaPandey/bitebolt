import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, TouchableOpacity, Alert, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analyticsApi } from '@/api';
import { MetricCard } from '@/components/analytics/MetricCard';
import { PopularItems } from '@/components/analytics/PopularItems';
import { SalesChart } from '@/components/analytics/SalesChart';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useAdminAuthStore } from '@/store/auth.store';
import {
  chartColors,
  color,
  elevation,
  layout,
  motion,
  opacity,
  orderTone,
  press,
  radius,
  space,
  text,
} from '@/theme';

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

const panelStyle = {
  backgroundColor: color.surface,
  marginHorizontal: layout.screenX,
  borderRadius: radius.panel,
  padding: space[5],
  marginBottom: space[4],
  ...elevation.md,
};

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

  const {
    data: overview,
    isLoading: loadingOverview,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
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
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: layout.listBottomInset }}
      >
        {/* Header */}
        <View
          style={[
            {
              paddingTop: insets.top + space[4],
              paddingBottom: space[6],
              paddingHorizontal: layout.screenX,
              backgroundColor: color.brand,
              borderBottomLeftRadius: radius.hero,
              borderBottomRightRadius: radius.hero,
              marginBottom: space[6],
            },
            elevation.brandHero,
          ]}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Animated.View
              entering={FadeInDown.duration(motion.slow).springify()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[3],
                flex: 1,
                marginRight: space[3],
              }}
            >
              <Image
                source={require('../../assets/images/logo.jpg')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.full,
                  backgroundColor: color.surface,
                }}
              />
              <View>
                <Text
                  style={[text.bodyStrong, { color: color.onBrandMuted, marginBottom: space[0.5] }]}
                >
                  {getGreeting()},
                </Text>
                <Text style={[text.h1, { color: color.onBrand }]}>{user?.name ?? 'Admin'}</Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(100).duration(motion.slow).springify()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space[2.5] }}
            >
              <View
                style={{
                  backgroundColor: `rgba(255,255,255,${opacity.overlay})`,
                  borderRadius: radius.field,
                  paddingHorizontal: space[4],
                  paddingVertical: space[2.5],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[1.5],
                }}
              >
                <Ionicons name="calendar-clear-outline" size={16} color={color.onBrand} />
                <Text style={[text.bodyStrong, { color: color.onBrand }]}>{getDateString()}</Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={press.secondary}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.full,
                  backgroundColor: `rgba(255,255,255,${opacity.overlayStrong})`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="log-out-outline" size={22} color={color.onBrand} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Overview metrics */}
        <Animated.View entering={FadeInDown.delay(200).duration(motion.slow).springify()}>
          <SectionHeader title="Today's Overview" />

          {loadingOverview ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: layout.screenX, gap: space[4] }}
            >
              <SkeletonCard height={140} width={160} />
              <SkeletonCard height={140} width={160} />
              <SkeletonCard height={140} width={160} />
            </ScrollView>
          ) : overviewError ? (
            <ErrorState
              title="Couldn't load overview"
              subtitle="Today's metrics are unavailable right now."
              onRetry={refetchOverview}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: layout.screenX,
                paddingBottom: space[4],
                paddingTop: space[1],
              }}
            >
              <MetricCard
                label="Orders Today"
                value={String(overview?.ordersToday ?? 0)}
                icon="receipt-outline"
                accent={chartColors[0]}
              />
              <MetricCard
                label="Revenue Today"
                value={formatCurrency(overview?.revenueToday ?? 0)}
                icon="cash-outline"
                accent={chartColors[1]}
              />
              <MetricCard
                label="Total Revenue"
                value={formatCurrency(overview?.totalRevenue ?? 0)}
                icon="trending-up-outline"
                accent={chartColors[2]}
              />
              <MetricCard
                label="Pending Orders"
                value={String(overview?.pendingOrders ?? 0)}
                icon="time-outline"
                accent={chartColors[3]}
              />
            </ScrollView>
          )}
        </Animated.View>

        {/* Daily Sales Chart */}
        <Animated.View entering={FadeInDown.delay(300).duration(motion.slow).springify()}>
          <SectionHeader title="Revenue Insights" />
          <View style={panelStyle}>
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
        <Animated.View entering={FadeInDown.delay(400).duration(motion.slow).springify()}>
          <SectionHeader title="Trending Items" />
          <View style={{ paddingHorizontal: layout.screenX }}>
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
                  paddingVertical: space[10],
                  backgroundColor: color.surface,
                  borderRadius: radius.panel,
                }}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={48}
                  color={color.disabled}
                  style={{ marginBottom: space[4] }}
                />
                <Text style={[text.bodyLg, { color: color.textSecondary, textAlign: 'center' }]}>
                  No trending items yet
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Order Statistics */}
        <Animated.View entering={FadeInDown.delay(500).duration(motion.slow).springify()}>
          <SectionHeader title="Order Statistics" />
          <View style={panelStyle}>
            {loadingOrderStats || !orderStats ? (
              <SkeletonCard height={120} />
            ) : (
              <>
                <Text
                  style={[text.label, { color: color.textSecondary, marginBottom: space[2.5] }]}
                >
                  By Status
                </Text>
                <View style={{ gap: space[2], marginBottom: space[4] }}>
                  {Object.entries(orderStats.byStatus ?? {}).map(([status, count]) => {
                    const tone = orderTone(status);
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
                            backgroundColor: tone.bg,
                            borderRadius: radius.full,
                            paddingHorizontal: space[2.5],
                            paddingVertical: space[1],
                          }}
                        >
                          <Text style={[text.captionStrong, { color: tone.text }]}>
                            {tone.label}
                          </Text>
                        </View>
                        <Text style={[text.bodyStrong, { color: color.textPrimary }]}>
                          {String(count)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <Text
                  style={[text.label, { color: color.textSecondary, marginBottom: space[2.5] }]}
                >
                  By Payment Method
                </Text>
                <View style={{ gap: space[2] }}>
                  {Object.entries(orderStats.byPaymentMethod ?? {}).map(([method, count]) => (
                    <View
                      key={method}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={[text.labelMuted, { color: color.textPrimary }]}>
                        {PAYMENT_METHOD_LABELS[method] ?? method}
                      </Text>
                      <Text style={[text.bodyStrong, { color: color.textPrimary }]}>
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
