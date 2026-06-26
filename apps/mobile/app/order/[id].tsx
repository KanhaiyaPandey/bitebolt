import { OrderStatus, PaymentStatus } from '@bitebolt/types';
import type { Order, OrderItem } from '@bitebolt/types';
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusColor,
  getOrderStatusLabel,
} from '@bitebolt/utils';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ordersApi } from '../../src/api';

const STATUS_STEPS: {
  status: OrderStatus;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { status: OrderStatus.PENDING, label: 'Received', icon: 'receipt-outline' },
  { status: OrderStatus.ACCEPTED, label: 'Accepted', icon: 'checkmark-circle-outline' },
  { status: OrderStatus.PREPARING, label: 'Preparing', icon: 'restaurant-outline' },
  { status: OrderStatus.OUT_FOR_DELIVERY, label: 'On the way', icon: 'bicycle-outline' },
  { status: OrderStatus.DELIVERED, label: 'Delivered', icon: 'checkmark-done-circle-outline' },
];

const STATUS_ORDER = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const CANCELLABLE_STATUSES = [OrderStatus.PENDING, OrderStatus.ACCEPTED];

function getActiveStep(status: OrderStatus): number {
  if (status === OrderStatus.REJECTED || status === OrderStatus.CANCELLED) return -1;
  return STATUS_ORDER.indexOf(status);
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrderById(id) as Promise<Order>,
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const active =
        status &&
        ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(status);
      return active ? 15000 : false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => {
      Alert.alert('Cancel Failed', err.message ?? 'Could not cancel order.');
    },
  });

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FA7938" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text
            style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#414158', marginTop: 16 }}
          >
            Order not found
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#FA7938' }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeStep = getActiveStep(order.status);
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isRejected = order.status === OrderStatus.REJECTED;
  const isTerminal = isCancelled || isRejected;
  const statusColor = getOrderStatusColor(order.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            shadowColor: '#1A1A2E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#414158" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
            Order Details
          </Text>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>
            {order.orderNumber}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: statusColor + '18',
          }}
        >
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 12, color: statusColor }}>
            {getOrderStatusLabel(order.status)}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Status Timeline ───────────────────────────── */}
        {!isTerminal ? (
          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={{ paddingHorizontal: 20, marginBottom: 20 }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 20,
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 15,
                  color: '#414158',
                  marginBottom: 20,
                }}
              >
                Order Status
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx < activeStep;
                  const active = idx === activeStep;
                  const color = done || active ? '#FA7938' : '#C4C9D4';

                  return (
                    <View key={step.status} style={{ flex: 1, alignItems: 'center' }}>
                      {idx > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 19,
                            right: '50%',
                            left: '-50%',
                            height: 2,
                            backgroundColor: idx <= activeStep ? '#FA7938' : '#E5E7EB',
                          }}
                        />
                      )}
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: done || active ? '#FA793820' : '#F4F4FA',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: active ? 2 : 0,
                          borderColor: '#FA7938',
                          zIndex: 1,
                        }}
                      >
                        <Ionicons name={step.icon} size={17} color={color} />
                      </View>
                      <Text
                        style={{
                          fontFamily: active ? 'Urbanist-SemiBold' : 'Urbanist',
                          fontSize: 10,
                          color: done || active ? '#414158' : '#9098B1',
                          marginTop: 6,
                          textAlign: 'center',
                        }}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={{ paddingHorizontal: 20, marginBottom: 20 }}
          >
            <View
              style={{
                backgroundColor: statusColor + '12',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Ionicons
                name={isCancelled ? 'close-circle-outline' : 'ban-outline'}
                size={28}
                color={statusColor}
              />
              <View>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: statusColor }}>
                  Order {isCancelled ? 'Cancelled' : 'Rejected'}
                </Text>
                <Text
                  style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginTop: 2 }}
                >
                  {isCancelled
                    ? 'This order has been cancelled.'
                    : 'This order was rejected by the restaurant.'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Delivery Address ──────────────────────────── */}
        {order.deliveryAddress && (
          <Animated.View
            entering={FadeInDown.delay(160).duration(400)}
            style={{ paddingHorizontal: 20, marginBottom: 16 }}
          >
            <SectionCard>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#EEEEF5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="location-outline" size={18} color="#FA7938" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>
                    {order.deliveryAddress.label}
                  </Text>
                  <Text
                    style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginTop: 2 }}
                  >
                    {order.deliveryAddress.addressLine1}
                    {order.deliveryAddress.addressLine2
                      ? `, ${order.deliveryAddress.addressLine2}`
                      : ''}
                  </Text>
                  <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} –{' '}
                    {order.deliveryAddress.pincode}
                  </Text>
                </View>
              </View>
            </SectionCard>
          </Animated.View>
        )}

        {/* ── Order Items ───────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={{ paddingHorizontal: 20, marginBottom: 16 }}
        >
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginBottom: 12,
            }}
          >
            Items ({order.items.length})
          </Text>
          <SectionCard>
            {order.items.map((item, idx) => (
              <OrderItemRow key={item.id} item={item} showDivider={idx < order.items.length - 1} />
            ))}
          </SectionCard>
        </Animated.View>

        {/* ── Bill Summary ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(400)}
          style={{ paddingHorizontal: 20, marginBottom: 16 }}
        >
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginBottom: 12,
            }}
          >
            Bill Summary
          </Text>
          <SectionCard>
            <BillRow label="Subtotal" value={formatCurrency(Number(order.subtotal))} />
            <BillRow label="Delivery Fee" value={formatCurrency(Number(order.deliveryFee))} />
            <BillRow label="Tax (5%)" value={formatCurrency(Number(order.taxes))} />
            {Number(order.discount) > 0 && (
              <BillRow
                label="Discount"
                value={`- ${formatCurrency(Number(order.discount))}`}
                valueColor="#10B981"
              />
            )}
            <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 10 }} />
            <BillRow
              label="Total Paid"
              value={formatCurrency(Number(order.total))}
              bold
              valueColor="#FA7938"
            />
          </SectionCard>
        </Animated.View>

        {/* ── Payment Info ──────────────────────────────── */}
        {order.payment && (
          <Animated.View
            entering={FadeInDown.delay(380).duration(400)}
            style={{ paddingHorizontal: 20, marginBottom: 16 }}
          >
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 16,
                color: '#414158',
                marginBottom: 12,
              }}
            >
              Payment
            </Text>
            <SectionCard>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: '#EEEEF5',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="card-outline" size={18} color="#FA7938" />
                  </View>
                  <View>
                    <Text
                      style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}
                    >
                      {order.payment.method}
                    </Text>
                    <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>
                      {order.payment.status === PaymentStatus.CAPTURED
                        ? 'Paid'
                        : order.payment.status}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158' }}>
                  {formatCurrency(Number(order.payment.amount))}
                </Text>
              </View>
            </SectionCard>
          </Animated.View>
        )}

        {/* ── Order Meta ────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(440).duration(400)}
          style={{ paddingHorizontal: 20, marginBottom: 24 }}
        >
          <SectionCard>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
            >
              <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                Order placed
              </Text>
              <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 13, color: '#414158' }}>
                {formatDateTime(order.createdAt)}
              </Text>
            </View>
            {order.estimatedDeliveryTime && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                  Estimated time
                </Text>
                <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 13, color: '#414158' }}>
                  {order.estimatedDeliveryTime} min
                </Text>
              </View>
            )}
          </SectionCard>
        </Animated.View>

        {/* ── Cancel Button ─────────────────────────────── */}
        {CANCELLABLE_STATUSES.includes(order.status) && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            style={{ paddingHorizontal: 20, marginBottom: 24 }}
          >
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              style={{
                borderWidth: 1.5,
                borderColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
              }}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#EF4444' }}>
                  Cancel Order
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function OrderItemRow({ item, showDivider }: { item: OrderItem; showDivider: boolean }) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 1,
            borderWidth: 1.5,
            borderColor: item.foodItem?.isVeg ? '#10B981' : '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: item.foodItem?.isVeg ? '#10B981' : '#EF4444',
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 14, color: '#414158' }}>
            {item.name}
          </Text>
          {item.specialInstructions && (
            <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginTop: 2 }}>
              {item.specialInstructions}
            </Text>
          )}
        </View>
        <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginRight: 12 }}>
          × {item.quantity}
        </Text>
        <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>
          {formatCurrency(Number(item.subtotal))}
        </Text>
      </View>
      {showDivider && <View style={{ height: 1, backgroundColor: '#F4F4FA' }} />}
    </>
  );
}

function BillRow({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text
        style={{
          fontFamily: bold ? 'Urbanist-SemiBold' : 'Urbanist',
          fontSize: 14,
          color: bold ? '#414158' : '#9098B1',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: bold ? 'Urbanist-Bold' : 'Urbanist-Medium',
          fontSize: 14,
          color: valueColor ?? (bold ? '#414158' : '#9098B1'),
        }}
      >
        {value}
      </Text>
    </View>
  );
}
