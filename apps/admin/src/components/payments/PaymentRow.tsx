import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { color, font, motion, paymentTone, radius, space, text, ui } from '@/theme';

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
  const tone = paymentTone(item.status);
  const icon = METHOD_ICONS[item.method] ?? 'card-outline';

  async function copyId(id: string) {
    await Clipboard.setStringAsync(id);
    Haptics.selectionAsync();
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.base)
        .springify()}
    >
      <View style={ui.card}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[2] }}>
          <View
            style={[
              ui.iconTile(36, color.brandSubtle, radius.control),
              { marginRight: space[2.5] },
            ]}
          >
            <Ionicons name={icon} size={18} color={color.brand} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[text.emphasis, { color: color.brand }]}>
              ₹{Number(item.amount).toFixed(2)}
            </Text>
            <Text style={[text.caption, { color: color.textSecondary }]}>
              {item.method} · {item.user?.name ?? item.user?.phone ?? '—'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: space[1] }}>
            <View style={ui.badge(tone.bg)}>
              <Text style={[text.overline, { color: tone.text }]}>{item.status}</Text>
            </View>
            {item.order?.orderNumber && (
              <TouchableOpacity
                onPress={() => item.order && router.push(`/order/${item.order.id}`)}
              >
                <Text style={[text.overline, { color: color.textSecondary }]}>
                  #{item.order.orderNumber}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* RZP IDs */}
        {(item.razorpayOrderId || item.razorpayPaymentId) && (
          <View
            style={{
              gap: space[1],
              borderTopWidth: 1,
              borderTopColor: color.surfaceSubtle,
              paddingTop: space[2],
            }}
          >
            {item.razorpayOrderId && (
              <TouchableOpacity
                onPress={() => copyId(item.razorpayOrderId!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space[1.5] }}
              >
                <Text style={[text.overline, { color: color.textSecondary }]}>Order:</Text>
                <Text
                  style={[
                    text.overline,
                    { fontFamily: font.medium, color: color.textPrimary, flex: 1 },
                  ]}
                >
                  {truncateId(item.razorpayOrderId)}
                </Text>
                <Ionicons name="copy-outline" size={12} color={color.textMuted} />
              </TouchableOpacity>
            )}
            {item.razorpayPaymentId && (
              <TouchableOpacity
                onPress={() => copyId(item.razorpayPaymentId!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space[1.5] }}
              >
                <Text style={[text.overline, { color: color.textSecondary }]}>Pay:</Text>
                <Text
                  style={[
                    text.overline,
                    { fontFamily: font.medium, color: color.textPrimary, flex: 1 },
                  ]}
                >
                  {truncateId(item.razorpayPaymentId)}
                </Text>
                <Ionicons name="copy-outline" size={12} color={color.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {item.walletAmountUsed && Number(item.walletAmountUsed) > 0 && (
          <Text style={[text.overline, { color: color.textSecondary, marginTop: space[1] }]}>
            +₹{Number(item.walletAmountUsed).toFixed(2)} from wallet
          </Text>
        )}

        <Text style={[text.overline, { color: color.textMuted, marginTop: space[1.5] }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    </Animated.View>
  );
}
