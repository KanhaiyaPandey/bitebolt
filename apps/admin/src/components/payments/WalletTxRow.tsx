import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

const REASON_STYLES: Record<string, { bg: string; text: string }> = {
  ORDER_PAYMENT: { bg: '#FEE2E2', text: '#7F1D1D' },
  ORDER_REFUND: { bg: '#D1FAE5', text: '#065F46' },
  TOP_UP: { bg: '#DBEAFE', text: '#1E3A5F' },
  CASHBACK: { bg: '#EDE9FE', text: '#4C1D95' },
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

export function WalletTxRow({ item, index }: WalletTxRowProps) {
  const isCredit = item.type === 'CREDIT';
  const reasonStyle = REASON_STYLES[item.reason] ?? { bg: '#F3F4F6', text: '#374151' };

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
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {/* Type icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={18}
            color={isCredit ? '#065F46' : '#7F1D1D'}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <View
              style={{
                backgroundColor: reasonStyle.bg,
                borderRadius: 999,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 10, color: reasonStyle.text }}
              >
                {item.reason.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text
              style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginBottom: 2 }}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}

          <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1' }}>
            {item.userName ?? item.userPhone ?? '—'} · {formatTime(item.createdAt)}
          </Text>
        </View>

        {/* Amount + balance */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: 'Urbanist-Bold',
              fontSize: 15,
              color: isCredit ? '#065F46' : '#EF4444',
            }}
          >
            {isCredit ? '+' : '−'}₹{Number(item.amount).toFixed(2)}
          </Text>
          {item.balanceAfter != null && (
            <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#C4C9D4', marginTop: 2 }}>
              Bal: ₹{Number(item.balanceAfter).toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
