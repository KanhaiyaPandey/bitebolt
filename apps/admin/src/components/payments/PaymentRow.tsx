import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Payment {
  id: string;
  order?: { id: string; orderNumber: string; total: number | string } | null;
  user?: { id: string; name: string | null; phone: string } | null;
  amount: number | string;
  method: string;
  status: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  walletAmountUsed?: number | string;
  createdAt: string | Date;
}

interface PaymentRowProps {
  item: Payment;
  index: number;
}

const METHOD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  UPI: 'scan-outline',
  CARD: 'card-outline',
  NET_BANKING: 'globe-outline',
  WALLET: 'wallet-outline',
  COD: 'cash-outline',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  CAPTURED: { bg: '#D1FAE5', text: '#065F46' },
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  FAILED: { bg: '#FEE2E2', text: '#7F1D1D' },
  REFUNDED: { bg: '#DBEAFE', text: '#1E3A5F' },
};

function formatTime(dt: string | Date) {
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function truncateId(id?: string | null) {
  if (!id) return null;
  return id.length > 16 ? `${id.slice(0, 14)}…` : id;
}

export function PaymentRow({ item, index }: PaymentRowProps) {
  const router = useRouter();
  const statusStyle = STATUS_STYLES[item.status] ?? { bg: '#F3F4F6', text: '#374151' };
  const icon = METHOD_ICONS[item.method] ?? 'card-outline';

  async function copyId(id: string) {
    await Clipboard.setStringAsync(id);
    Haptics.selectionAsync();
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .duration(300)
        .springify()}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 10,
          padding: 14,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#FFF4EE',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Ionicons name={icon} size={18} color="#FA7938" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#FA7938' }}>
              ₹{Number(item.amount).toFixed(2)}
            </Text>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>
              {item.method} · {item.user?.name ?? item.user?.phone ?? '—'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View
              style={{
                backgroundColor: statusStyle.bg,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 11, color: statusStyle.text }}
              >
                {item.status}
              </Text>
            </View>
            {item.order?.orderNumber && (
              <TouchableOpacity
                onPress={() => item.order && router.push(`/order/${item.order.id}`)}
              >
                <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1' }}>
                  #{item.order.orderNumber}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* RZP IDs */}
        {(item.razorpayOrderId || item.razorpayPaymentId) && (
          <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: '#F5F5FA', paddingTop: 8 }}>
            {item.razorpayOrderId && (
              <TouchableOpacity
                onPress={() => copyId(item.razorpayOrderId!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1' }}>
                  Order:
                </Text>
                <Text
                  style={{ fontFamily: 'Urbanist-Medium', fontSize: 11, color: '#414158', flex: 1 }}
                >
                  {truncateId(item.razorpayOrderId)}
                </Text>
                <Ionicons name="copy-outline" size={12} color="#C4C9D4" />
              </TouchableOpacity>
            )}
            {item.razorpayPaymentId && (
              <TouchableOpacity
                onPress={() => copyId(item.razorpayPaymentId!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1' }}>Pay:</Text>
                <Text
                  style={{ fontFamily: 'Urbanist-Medium', fontSize: 11, color: '#414158', flex: 1 }}
                >
                  {truncateId(item.razorpayPaymentId)}
                </Text>
                <Ionicons name="copy-outline" size={12} color="#C4C9D4" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {item.walletAmountUsed && Number(item.walletAmountUsed) > 0 && (
          <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginTop: 4 }}>
            +₹{Number(item.walletAmountUsed).toFixed(2)} from wallet
          </Text>
        )}

        <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#C4C9D4', marginTop: 6 }}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    </Animated.View>
  );
}
