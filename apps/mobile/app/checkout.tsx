import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { cartApi } from '../src/api';
import type { Cart } from '@bitebolt/types';
import { useAuthStore } from '../src/store/auth.store';

type DeliveryMode = 'delivery' | 'pickup';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CheckoutScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery');

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart() as Promise<Cart>,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
            shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#414158" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>
          Checkout
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={22} color="#414158" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Delivery / Pickup toggle ───────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#FFFFFF', borderRadius: 14,
            padding: 4, gap: 4,
            shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
          }}>
            {(['delivery', 'pickup'] as DeliveryMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setDeliveryMode(mode)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 10,
                  backgroundColor: deliveryMode === mode ? '#414158' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontFamily: 'Urbanist-SemiBold', fontSize: 14,
                  color: deliveryMode === mode ? '#FFFFFF' : '#9098B1',
                  textTransform: 'capitalize',
                }}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Map placeholder ───────────────────────────── */}
        {deliveryMode === 'delivery' && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              height: 180, borderRadius: 16, overflow: 'hidden',
              backgroundColor: '#2C3E50',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
            }}>
              {/* Dark map mock */}
              <View style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
                {/* Grid lines */}
                {[...Array(6)].map((_, i) => (
                  <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * 30, height: 1, backgroundColor: '#ffffff15' }} />
                ))}
                {[...Array(8)].map((_, i) => (
                  <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 50, width: 1, backgroundColor: '#ffffff15' }} />
                ))}
              </View>
              {/* Pin */}
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#FA7938', alignItems: 'center', justifyContent: 'center',
                shadowColor: '#FA7938', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
              }}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
              <TouchableOpacity style={{
                position: 'absolute', bottom: 12, right: 12,
                backgroundColor: '#FFFFFF', borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 7,
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
                <Ionicons name="pencil" size={13} color="#414158" />
                <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 12, color: '#414158' }}>
                  Edit Pin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Checkout Details ──────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158', marginBottom: 14 }}>
            Checkout Details
          </Text>

          <DetailRow
            icon="home-outline"
            title="Delivery Address"
            value="633 Rose Ave, Venice, CA"
            onPress={() => {}}
          />
          <DetailRow
            icon="time-outline"
            title="Delivery Time"
            value="15 - 20 min"
            onPress={() => {}}
          />
          <DetailRow
            icon="card-outline"
            title="Payment Method"
            value="Credit Card"
            onPress={() => {}}
          />
        </View>

        {/* ── Order summary ─────────────────────────────── */}
        {cart && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158', marginBottom: 14 }}>
              Order Summary
            </Text>
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
              shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
            }}>
              <SummaryRow label="Subtotal" value={`$${Number(cart.subtotal).toFixed(2)}`} />
              <SummaryRow label="Shipping" value={`$${Number(cart.deliveryFee).toFixed(2)}`} />
              <SummaryRow label="Tax (5%)" value={`$${Number(cart.taxes).toFixed(2)}`} />
              <View style={{ height: 1, backgroundColor: '#EEEEF5', marginVertical: 10 }} />
              <SummaryRow
                label="Total"
                value={`$${Number(cart.total).toFixed(2)}`}
                bold
                valueColor="#FA7938"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Place Order CTA ───────────────────────────────── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28,
        shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08, shadowRadius: 16, elevation: 10,
        flexDirection: 'row', alignItems: 'center', gap: 16,
      }}>
        {cart && (
          <View>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>Total</Text>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
              ${Number(cart.total).toFixed(2)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/phone');
            }
          }}
          style={{
            flex: 1, backgroundColor: '#FA7938', borderRadius: 14,
            paddingVertical: 16, alignItems: 'center',
            shadowColor: '#FA7938', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
          }}
        >
          <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
            Place Order
          </Text>
        </TouchableOpacity>
      </View>
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
        backgroundColor: '#FFFFFF', borderRadius: 14,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 14,
        marginBottom: 10,
        shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
      }}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#EEEEF5', alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name={icon} size={18} color="#FA7938" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>{title}</Text>
        <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158', marginTop: 1 }}>
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
      <Text style={{
        fontFamily: bold ? 'Urbanist-SemiBold' : 'Urbanist',
        fontSize: 14, color: bold ? '#414158' : '#9098B1',
      }}>
        {label}
      </Text>
      <Text style={{
        fontFamily: bold ? 'Urbanist-Bold' : 'Urbanist-Medium',
        fontSize: 14, color: valueColor ?? (bold ? '#414158' : '#9098B1'),
      }}>
        {value}
      </Text>
    </View>
  );
}
