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
import { color, elevation, layout, press, radius, space, text } from '@/theme';

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

// Shared section card (white panel used for every detail block).
const sectionCard = [
  {
    backgroundColor: color.surface,
    marginHorizontal: layout.screenX,
    borderRadius: radius.card,
    padding: space[3.5],
    marginBottom: space[3],
  },
  elevation.sm,
];

// Full-width status action button (green / red / brand).
function ActionButton({
  label,
  tone,
  onPress,
  loading,
  disabled,
  flex,
}: {
  label: string;
  tone: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  flex?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={press.card}
      style={{
        flex: flex ? 1 : undefined,
        backgroundColor: tone,
        borderRadius: radius.button,
        paddingVertical: space[3.5],
        alignItems: 'center',
      }}
    >
      {loading ? (
        <ActivityIndicator color={color.onBrand} />
      ) : (
        <Text style={[text.buttonSm, { color: color.onBrand }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

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
      return ordersApi.updateStatus(id!, { status, rejectionReason: notes, notes });
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
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <ScreenHeader title="Order Detail" showBack />
        <SkeletonCard height={200} />
        <SkeletonCard height={150} />
        <SkeletonCard height={100} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <ScreenHeader title="Order Detail" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[text.body, { color: color.textSecondary }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];
  const rejectEnabled = !!rejectReason.trim();

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScreenHeader
        title={`#${order.orderNumber}`}
        showBack
        rightElement={<StatusBadge status={order.status} />}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: space[8] }}>
        {/* Status actions */}
        {order.status === 'PENDING' && (
          <View style={{ flexDirection: 'row', gap: space[3], padding: layout.screenX }}>
            <ActionButton
              label="Accept Order"
              tone={color.success}
              flex
              loading={statusMutation.isPending}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                statusMutation.mutate({ status: 'ACCEPTED' });
              }}
            />
            <ActionButton
              label="Reject"
              tone={color.error}
              flex
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                rejectSheetRef.current?.expand();
              }}
            />
          </View>
        )}

        {nextStatus && order.status !== 'PENDING' && (
          <View style={{ padding: layout.screenX }}>
            <ActionButton
              label={STATUS_ACTION_LABELS[nextStatus] ?? nextStatus}
              tone={color.brand}
              loading={statusMutation.isPending}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                statusMutation.mutate({ status: nextStatus });
              }}
            />
          </View>
        )}

        {/* Customer */}
        <SectionHeader title="Customer" />
        <View style={sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[1.5] }}>
            <Ionicons
              name="person-outline"
              size={16}
              color={color.textSecondary}
              style={{ marginRight: space[2] }}
            />
            <Text style={[text.bodyStrong, { color: color.textPrimary }]}>
              {order.user?.name ?? '—'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="call-outline"
              size={16}
              color={color.textSecondary}
              style={{ marginRight: space[2] }}
            />
            <Text style={[text.body, { color: color.textSecondary }]}>
              {order.user?.phone ?? '—'}
            </Text>
          </View>
        </View>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <>
            <SectionHeader title="Delivery Address" />
            <View style={sectionCard}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={color.brand}
                  style={{ marginRight: space[2], marginTop: space[0.5] }}
                />
                <Text style={[text.body, { flex: 1, color: color.textPrimary }]}>
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
        <View style={sectionCard}>
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
                  paddingVertical: space[2],
                  borderBottomWidth: 1,
                  borderBottomColor: color.surfaceSubtle,
                }}
              >
                <Text style={[text.bodyLg, { flex: 1, fontSize: 14, color: color.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[text.label, { color: color.textSecondary, marginRight: space[4] }]}>
                  ×{item.quantity}
                </Text>
                <Text style={[text.bodyStrong, { color: color.textPrimary }]}>
                  ₹{Number(item.subtotal).toFixed(2)}
                </Text>
              </View>
            ),
          )}

          {/* Bill summary */}
          <View style={{ marginTop: space[3], gap: space[1.5] }}>
            {[
              { label: 'Subtotal', value: order.subtotal },
              { label: 'Delivery Fee', value: order.deliveryFee },
              { label: 'Taxes', value: order.taxes },
              order.discount > 0 && { label: 'Discount', value: -order.discount },
            ]
              .filter(Boolean)
              .map((row) => (
                <View key={(row as { label: string }).label} style={{ flexDirection: 'row' }}>
                  <Text style={[text.label, { flex: 1, color: color.textSecondary }]}>
                    {(row as { label: string }).label}
                  </Text>
                  <Text style={[text.label, { color: color.textPrimary }]}>
                    ₹{Math.abs(Number((row as { value: number }).value)).toFixed(2)}
                  </Text>
                </View>
              ))}
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: color.borderSubtle,
                paddingTop: space[2],
                marginTop: space[1],
              }}
            >
              <Text style={[text.emphasis, { flex: 1, color: color.textPrimary }]}>Total</Text>
              <Text style={[text.emphasis, { color: color.brand }]}>
                ₹{Number(order.total).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment info */}
        {order.payment && (
          <>
            <SectionHeader title="Payment" />
            <View style={[sectionCard, { gap: space[1.5] }]}>
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
                    <Text style={[text.label, { flex: 1, color: color.textSecondary }]}>
                      {(row as { label: string }).label}
                    </Text>
                    <Text
                      style={[
                        text.labelMuted,
                        { color: color.textPrimary, flex: 1, textAlign: 'right' },
                      ]}
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
            <View style={sectionCard}>
              <StatusTimeline history={order.statusHistory} />
            </View>
          </>
        )}

        {/* Special instructions */}
        {order.specialInstructions && (
          <>
            <SectionHeader title="Special Instructions" />
            <View style={sectionCard}>
              <Text style={[text.body, { color: color.textPrimary }]}>
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
        handleIndicatorStyle={{
          backgroundColor: color.disabled,
          width: space[8],
          height: space[1],
        }}
        backgroundStyle={{
          backgroundColor: color.surface,
          borderTopLeftRadius: radius.panel,
          borderTopRightRadius: radius.panel,
        }}
      >
        <BottomSheetView style={{ padding: space[6] }}>
          <Text style={[text.h3, { color: color.textPrimary, marginBottom: space[2] }]}>
            Reject Order
          </Text>
          <Text style={[text.body, { color: color.textSecondary, marginBottom: space[4] }]}>
            Please provide a reason for the customer.
          </Text>
          <BottomSheetTextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="e.g. Item unavailable, kitchen closed…"
            placeholderTextColor={color.textMuted}
            multiline
            numberOfLines={3}
            style={[
              text.body,
              {
                backgroundColor: color.surfaceSubtle,
                borderRadius: radius.control,
                padding: space[3.5],
                color: color.textPrimary,
                minHeight: 80,
                marginBottom: space[4],
                textAlignVertical: 'top',
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => statusMutation.mutate({ status: 'REJECTED', notes: rejectReason })}
            disabled={statusMutation.isPending || !rejectEnabled}
            activeOpacity={press.card}
            style={{
              backgroundColor: rejectEnabled ? color.error : color.borderStrong,
              borderRadius: radius.button,
              paddingVertical: space[3.5],
              alignItems: 'center',
            }}
          >
            {statusMutation.isPending ? (
              <ActivityIndicator color={color.onBrand} />
            ) : (
              <Text
                style={[
                  text.buttonSm,
                  { color: rejectEnabled ? color.onBrand : color.textSecondary },
                ]}
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
