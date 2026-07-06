import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ordersApi } from '@/api';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { StatusTimeline } from '@/components/orders/StatusTimeline';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const NEXT_STATUS: Record<string, string | null> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: null,
  REJECTED: null,
  CANCELLED: null,
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  ACCEPTED: 'Accept Order',
  PREPARING: 'Start Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Mark Delivered',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const rejectSheetRef = useRef<BottomSheet>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => ordersApi.getById(id!),
    refetchInterval: 15_000,
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) => {
      console.debug('[AdminOrders] Update status', { orderId: id, newStatus: status });
      return ordersApi.updateStatus(id!, { status, rejectionReason: notes });
    },
    onSuccess: (_, vars) => {
      console.debug('[AdminOrders] Status updated successfully', {
        orderId: id,
        newStatus: vars.status,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      rejectSheetRef.current?.close();
      setRejectReason('');
    },
    onError: (err) => {
      console.error('[AdminOrders] Failed to update status', { orderId: id, error: err });
    },
  });

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order: any = Array.isArray(data) ? data[0] : data;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
        <ScreenHeader title="Order Detail" showBack />
        <SkeletonCard height={200} />
        <SkeletonCard height={150} />
        <SkeletonCard height={100} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
        <ScreenHeader title="Order Detail" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Urbanist', color: '#9098B1' }}>Order not found</Text>
        </View>
      </View>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <ScreenHeader
        title={`#${order.orderNumber}`}
        showBack
        rightElement={<StatusBadge status={order.status} />}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Status actions */}
        {order.status === 'PENDING' && (
          <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                statusMutation.mutate({ status: 'ACCEPTED' });
              }}
              disabled={statusMutation.isPending}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: '#10B981',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {statusMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#FFF' }}>
                  Accept Order
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                rejectSheetRef.current?.expand();
              }}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#FFF' }}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {nextStatus && order.status !== 'PENDING' && (
          <View style={{ padding: 16 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                statusMutation.mutate({ status: nextStatus });
              }}
              disabled={statusMutation.isPending}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#FA7938',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {statusMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#FFF' }}>
                  {STATUS_ACTION_LABELS[nextStatus] ?? nextStatus}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Customer */}
        <SectionHeader title="Customer" />
        <View
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: 16,
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="person-outline" size={16} color="#9098B1" style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>
              {order.user?.name ?? '—'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="call-outline" size={16} color="#9098B1" style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1' }}>
              {order.user?.phone ?? '—'}
            </Text>
          </View>
        </View>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <>
            <SectionHeader title="Delivery Address" />
            <View
              style={{
                backgroundColor: '#FFF',
                marginHorizontal: 16,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#FA7938"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'Urbanist',
                    fontSize: 14,
                    color: '#414158',
                    lineHeight: 20,
                  }}
                >
                  {order.deliveryAddress.addressLine1}
                  {order.deliveryAddress.addressLine2
                    ? `, ${order.deliveryAddress.addressLine2}`
                    : ''}
                  {`, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Items */}
        <SectionHeader title="Items" />
        <View
          style={{
            backgroundColor: '#FFF',
            marginHorizontal: 16,
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          {order.items?.map(
            (item: {
              id: string;
              name: string;
              quantity: number;
              price: number | string;
              subtotal: number | string;
            }) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F5F5FA',
                }}
              >
                <Text
                  style={{ flex: 1, fontFamily: 'Urbanist-Medium', fontSize: 14, color: '#414158' }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Urbanist',
                    fontSize: 13,
                    color: '#9098B1',
                    marginRight: 16,
                  }}
                >
                  ×{item.quantity}
                </Text>
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>
                  ₹{Number(item.subtotal).toFixed(2)}
                </Text>
              </View>
            ),
          )}

          {/* Bill summary */}
          <View style={{ marginTop: 12, gap: 6 }}>
            {[
              { label: 'Subtotal', value: order.subtotal },
              { label: 'Delivery Fee', value: order.deliveryFee },
              { label: 'Taxes', value: order.taxes },
              order.discount > 0 && { label: 'Discount', value: -order.discount },
            ]
              .filter(Boolean)
              .map((row) => (
                <View key={(row as { label: string }).label} style={{ flexDirection: 'row' }}>
                  <Text style={{ flex: 1, fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                    {(row as { label: string }).label}
                  </Text>
                  <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#414158' }}>
                    ₹{Math.abs(Number((row as { value: number }).value)).toFixed(2)}
                  </Text>
                </View>
              ))}
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: '#F0F0F8',
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <Text
                style={{ flex: 1, fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158' }}
              >
                Total
              </Text>
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#FA7938' }}>
                ₹{Number(order.total).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment info */}
        {order.payment && (
          <>
            <SectionHeader title="Payment" />
            <View
              style={{
                backgroundColor: '#FFF',
                marginHorizontal: 16,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
                gap: 6,
              }}
            >
              {[
                { label: 'Method', value: order.payment.method },
                { label: 'Status', value: order.payment.status },
                { label: 'Amount', value: `₹${Number(order.payment.amount).toFixed(2)}` },
                order.payment.razorpayOrderId && {
                  label: 'RZP Order ID',
                  value: order.payment.razorpayOrderId,
                },
                order.payment.razorpayPaymentId && {
                  label: 'RZP Payment ID',
                  value: order.payment.razorpayPaymentId,
                },
              ]
                .filter(Boolean)
                .map((row) => (
                  <View key={(row as { label: string }).label} style={{ flexDirection: 'row' }}>
                    <Text
                      style={{ flex: 1, fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}
                    >
                      {(row as { label: string }).label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Urbanist-Medium',
                        fontSize: 13,
                        color: '#414158',
                        flex: 1,
                        textAlign: 'right',
                      }}
                      numberOfLines={1}
                    >
                      {(row as { value: string }).value}
                    </Text>
                  </View>
                ))}
            </View>
          </>
        )}

        {/* Status Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <>
            <SectionHeader title="Status Timeline" />
            <View
              style={{
                backgroundColor: '#FFF',
                marginHorizontal: 16,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <StatusTimeline history={order.statusHistory} />
            </View>
          </>
        )}

        {/* Special instructions */}
        {order.specialInstructions && (
          <>
            <SectionHeader title="Special Instructions" />
            <View
              style={{
                backgroundColor: '#FFF',
                marginHorizontal: 16,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#414158', lineHeight: 20 }}
              >
                {order.specialInstructions}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Reject reason sheet */}
      <BottomSheet
        ref={rejectSheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#D3D6DE', width: 32, height: 4 }}
        backgroundStyle={{
          backgroundColor: '#FFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <BottomSheetView style={{ padding: 24 }}>
          <Text
            style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#414158', marginBottom: 8 }}
          >
            Reject Order
          </Text>
          <Text
            style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', marginBottom: 16 }}
          >
            Please provide a reason for the customer.
          </Text>
          <BottomSheetTextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="e.g. Item unavailable, kitchen closed…"
            placeholderTextColor="#C4C9D4"
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: '#F5F5FA',
              borderRadius: 12,
              padding: 14,
              fontFamily: 'Urbanist',
              fontSize: 14,
              color: '#414158',
              minHeight: 80,
              marginBottom: 16,
              textAlignVertical: 'top',
            }}
          />
          <TouchableOpacity
            onPress={() => statusMutation.mutate({ status: 'REJECTED', notes: rejectReason })}
            disabled={statusMutation.isPending || !rejectReason.trim()}
            activeOpacity={0.85}
            style={{
              backgroundColor: rejectReason.trim() ? '#EF4444' : '#E0E0EA',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {statusMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 15,
                  color: rejectReason.trim() ? '#FFF' : '#9098B1',
                }}
              >
                Confirm Rejection
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
