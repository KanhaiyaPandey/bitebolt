import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
import { cartApi, ordersApi, usersApi, paymentsApi } from '../src/api';
import { useAuthStore } from '../src/store/auth.store';
import type { Cart, Address, Order } from '@bitebolt/types';

type DeliveryMode = 'delivery' | 'pickup';

interface PaymentOption {
  method: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { method: 'COD', label: 'Cash on Delivery', icon: 'cash-outline' },
  { method: 'UPI', label: 'UPI', icon: 'phone-portrait-outline' },
  { method: 'CARD', label: 'Credit / Debit Card', icon: 'card-outline' },
  { method: 'NET_BANKING', label: 'Net Banking', icon: 'globe-outline' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CheckoutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('COD');
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart() as Promise<Cart>,
    enabled: isAuthenticated,
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => usersApi.getAddresses(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (addresses?.length && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const placeOrderMutation = useMutation({
    mutationFn: async (): Promise<Order> => {
      if (deliveryMode === 'delivery' && !selectedAddressId) {
        throw new Error('Please select a delivery address');
      }

      // Guard: Razorpay native module is only available in dev/production builds, not Expo Go.
      if (paymentMethod !== 'COD' && !RazorpayCheckout) {
        throw new Error(
          'Online payment requires a native build. Please select Cash on Delivery or install a development build.',
        );
      }

      const order = await ordersApi.placeOrder({
        addressId: selectedAddressId ?? '',
        paymentMethod,
      });

      if (paymentMethod !== 'COD') {
        const rzpOrder = await paymentsApi.createRazorpayOrder({
          orderId: order.id,
          method: paymentMethod,
        });

        const payment = await RazorpayCheckout.open({
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'BiteBolt',
          description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
          order_id: rzpOrder.razorpayOrderId,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone,
          },
          theme: { color: '#FA7938' },
        });

        await paymentsApi.verifyPayment({
          razorpayOrderId: payment.razorpay_order_id,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      return order;
    },
    onSuccess: (order) => {
      router.replace(`/order/${order.id}`);
    },
    onError: (err: Error) => {
      // User dismissed Razorpay — order exists but is unpaid
      if ((err as { code?: number }).code === 0) {
        Alert.alert(
          'Payment Cancelled',
          'Your order is placed but payment is pending. You can retry from your orders page.',
        );
        router.replace('/(tabs)/orders');
        return;
      }
      Alert.alert('Order Failed', err.message ?? 'Something went wrong. Please try again.');
    },
  });

  if (!authLoading && !isAuthenticated) {
    router.replace('/(auth)/phone');
    return null;
  }

  const addressDisplay = selectedAddress
    ? `${selectedAddress.addressLine1}, ${selectedAddress.city}`
    : 'Select delivery address';

  const selectedPaymentOption = PAYMENT_OPTIONS.find((p) => p.method === paymentMethod);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View
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
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>
          Checkout
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Delivery / Pickup toggle ───────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 4,
              gap: 4,
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {(['delivery', 'pickup'] as DeliveryMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setDeliveryMode(mode)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: deliveryMode === mode ? '#414158' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 14,
                    color: deliveryMode === mode ? '#FFFFFF' : '#9098B1',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Delivery address visual ────────────────────── */}
        {deliveryMode === 'delivery' && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
                height: 100,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#2C3E50',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
                {[...Array(4)].map((_, i) => (
                  <View
                    key={`h${i}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: i * 25,
                      height: 1,
                      backgroundColor: '#ffffff15',
                    }}
                  />
                ))}
                {[...Array(6)].map((_, i) => (
                  <View
                    key={`v${i}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: i * (SCREEN_WIDTH / 5),
                      width: 1,
                      backgroundColor: '#ffffff15',
                    }}
                  />
                ))}
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#FA7938',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FA7938',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Ionicons name="location" size={18} color="#FFFFFF" />
              </View>
            </View>
          </View>
        )}

        {/* ── Checkout Details ──────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginBottom: 14,
            }}
          >
            Checkout Details
          </Text>

          {deliveryMode === 'delivery' && (
            <DetailRow
              icon="home-outline"
              title="Delivery Address"
              value={addressDisplay}
              onPress={() => setShowAddressPicker(true)}
            />
          )}

          <DetailRow
            icon="time-outline"
            title="Delivery Time"
            value="15 – 20 min"
            onPress={() => {}}
          />

          <DetailRow
            icon={selectedPaymentOption?.icon ?? 'card-outline'}
            title="Payment Method"
            value={selectedPaymentOption?.label ?? 'Select payment'}
            onPress={() => {}}
          />
        </View>

        {/* ── Payment method selector ───────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginBottom: 14,
            }}
          >
            Payment Method
          </Text>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {PAYMENT_OPTIONS.map((option, idx) => {
              const needsNative = option.method !== 'COD';
              const disabled = needsNative && !RazorpayCheckout;
              return (
                <TouchableOpacity
                  key={option.method}
                  onPress={() => !disabled && setPaymentMethod(option.method)}
                  activeOpacity={disabled ? 1 : 0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: idx < PAYMENT_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: '#F4F4FA',
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: '#EEEEF5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name={option.icon} size={18} color="#FA7938" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 15, color: '#414158' }}>
                      {option.label}
                    </Text>
                    {disabled && (
                      <Text
                        style={{
                          fontFamily: 'Urbanist',
                          fontSize: 11,
                          color: '#9098B1',
                          marginTop: 1,
                        }}
                      >
                        Requires a native build
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: paymentMethod === option.method ? '#FA7938' : '#C4C9D4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {paymentMethod === option.method && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#FA7938',
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Order summary ─────────────────────────────── */}
        {cart && (
          <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 16,
                color: '#414158',
                marginBottom: 14,
              }}
            >
              Order Summary
            </Text>
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
              <SummaryRow label="Subtotal" value={`₹${Number(cart.subtotal).toFixed(2)}`} />
              <SummaryRow label="Shipping" value={`₹${Number(cart.deliveryFee).toFixed(2)}`} />
              <SummaryRow label="Tax (5%)" value={`₹${Number(cart.taxes).toFixed(2)}`} />
              <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 10 }} />
              <SummaryRow
                label="Total"
                value={`₹${Number(cart.total).toFixed(2)}`}
                bold
                valueColor="#FA7938"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Place Order CTA ───────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 16,
          paddingBottom: 28,
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {cart && (
          <View>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>Total</Text>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
              ₹{Number(cart.total).toFixed(2)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => placeOrderMutation.mutate()}
          disabled={placeOrderMutation.isPending}
          style={{
            flex: 1,
            backgroundColor: placeOrderMutation.isPending ? '#FBAD85' : '#FA7938',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#FA7938',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {placeOrderMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
              Place Order
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Address Picker Modal ──────────────────────────── */}
      <Modal
        visible={showAddressPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#00000050' }}
          activeOpacity={1}
          onPress={() => setShowAddressPicker(false)}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: 40,
            maxHeight: '70%',
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#D3D6DE',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              fontFamily: 'Urbanist-Bold',
              fontSize: 18,
              color: '#414158',
              paddingHorizontal: 20,
              marginBottom: 16,
            }}
          >
            Select Address
          </Text>

          {!addresses?.length ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="location-outline" size={40} color="#C4C9D4" />
              <Text
                style={{
                  fontFamily: 'Urbanist',
                  fontSize: 14,
                  color: '#9098B1',
                  marginTop: 12,
                  textAlign: 'center',
                  paddingHorizontal: 32,
                }}
              >
                No saved addresses. Add one from your profile.
              </Text>
            </View>
          ) : (
            <FlatList
              data={addresses}
              keyExtractor={(a) => a.id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedAddressId(item.id);
                    setShowAddressPicker(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: selectedAddressId === item.id ? '#FFF5F0' : '#F8F9FA',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: selectedAddressId === item.id ? '#FA7938' : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: selectedAddressId === item.id ? '#FA793820' : '#EEEEF5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={selectedAddressId === item.id ? '#FA7938' : '#9098B1'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}
                      >
                        {item.label}
                      </Text>
                      {item.isDefault && (
                        <View
                          style={{
                            backgroundColor: '#FA793820',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Urbanist-SemiBold',
                              fontSize: 10,
                              color: '#FA7938',
                            }}
                          >
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Urbanist',
                        fontSize: 12,
                        color: '#9098B1',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.addressLine1}, {item.city} – {item.pincode}
                    </Text>
                  </View>
                  {selectedAddressId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#FA7938" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity
            onPress={() => {
              setShowAddressPicker(false);
              router.push('/addresses');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 14,
              marginHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: '#FA7938',
              gap: 8,
            }}
          >
            <Ionicons name="add" size={18} color="#FA7938" />
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#FA7938' }}>
              Add New Address
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────

function DetailRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: '#EEEEF5',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={18} color="#FA7938" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>{title}</Text>
        <Text
          style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158', marginTop: 1 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C9D4" />
    </TouchableOpacity>
  );
}

function SummaryRow({
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
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
