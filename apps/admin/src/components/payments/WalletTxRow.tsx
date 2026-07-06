import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { color, motion, space, text, ui, walletTone } from '@/theme';

interface WalletTx {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
  amount: number | string;
  balanceAfter?: number | string;
  description?: string | null;
  userName?: string | null;
  userPhone?: string | null;
  createdAt: string | Date;
}

interface WalletTxRowProps {
  item: WalletTx;
  index: number;
}

function formatTime(dt: string | Date) {
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function WalletTxRow({ item, index }: WalletTxRowProps) {
  const isCredit = item.type === 'CREDIT';
  const reasonTone = walletTone(item.reason);
  // Credit/debit share the green/red tones of refund/payment.
  const flowTone = isCredit ? walletTone('ORDER_REFUND') : walletTone('ORDER_PAYMENT');

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.base)
        .springify()}
    >
      <View style={[ui.card, { flexDirection: 'row', alignItems: 'center' }]}>
        {/* Type icon */}
        <View style={[ui.iconTile(40, flowTone.bg), { marginRight: space[3] }]}>
          <Ionicons
            name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={18}
            color={flowTone.text}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[1.5],
              marginBottom: space[0.5] + 1,
            }}
          >
            <View style={[ui.badge(reasonTone.bg), { paddingHorizontal: space[2] - 1 }]}>
              <Text style={[text.tiny, { color: reasonTone.text }]}>
                {item.reason.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text
              style={[text.caption, { color: color.textSecondary, marginBottom: space[0.5] }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}

          <Text style={[text.overline, { color: color.textSecondary }]}>
            {item.userName ?? item.userPhone ?? '—'} · {formatTime(item.createdAt)}
          </Text>
        </View>

        {/* Amount + balance */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[text.emphasis, { color: isCredit ? flowTone.text : color.error }]}>
            {isCredit ? '+' : '−'}₹{Number(item.amount).toFixed(2)}
          </Text>
          {item.balanceAfter != null && (
            <Text style={[text.overline, { color: color.textMuted, marginTop: space[0.5] }]}>
              Bal: ₹{Number(item.balanceAfter).toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
