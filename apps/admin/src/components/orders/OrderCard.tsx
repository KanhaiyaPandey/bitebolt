import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StatusBadge } from './StatusBadge';

import { color, motion, press, radius, space, text, ui } from '@/theme';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  createdAt: string | Date;
  user?: { name?: string | null; phone?: string };
  items?: { name: string; quantity: number }[];
}

interface OrderCardProps {
  order: Order;
  index: number;
  onAccept?: (id: string) => void;
}

function timeAgo(dt: string | Date) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function renderRightActions(onAccept: () => void) {
  return (
    <TouchableOpacity
      onPress={onAccept}
      activeOpacity={press.card}
      style={{
        backgroundColor: color.success,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: radius.card,
        marginBottom: space[3],
        marginLeft: space[2],
      }}
    >
      <Ionicons name="checkmark-circle" size={28} color={color.onBrand} />
      <Text style={[text.overline, { color: color.onBrand, marginTop: space[0.5] }]}>Accept</Text>
    </TouchableOpacity>
  );
}

export function OrderCard({ order, index, onAccept }: OrderCardProps) {
  const router = useRouter();
  const isPending = order.status === 'PENDING';

  const itemsPreview = order.items
    ?.slice(0, 3)
    .map((i) => `${i.name} ×${i.quantity}`)
    .join(', ');

  function handleAccept() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept?.(order.id);
  }

  const cardContent = (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.base)
        .springify()}
    >
      <TouchableOpacity
        activeOpacity={press.card}
        onPress={() => router.push(`/order/${order.id}`)}
        style={[ui.card, { marginBottom: space[3] }]}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[1.5] }}>
          <Text style={[text.emphasis, { flex: 1, color: color.textPrimary }]}>
            #{order.orderNumber}
          </Text>
          <StatusBadge status={order.status} size="sm" />
        </View>

        {/* Customer name */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[1] }}>
          <Ionicons
            name="person-outline"
            size={13}
            color={color.textSecondary}
            style={{ marginRight: space[1] + 1 }}
          />
          <Text style={[text.label, { color: color.textSecondary }]}>
            {order.user?.name ?? order.user?.phone ?? 'Unknown'}
          </Text>
        </View>

        {/* Items */}
        {itemsPreview && (
          <Text
            numberOfLines={1}
            style={[text.caption, { color: color.textMuted, marginBottom: space[2] }]}
          >
            {itemsPreview}
          </Text>
        )}

        {/* Bottom row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[text.emphasis, { flex: 1, color: color.brand }]}>
            ₹{Number(order.total).toFixed(2)}
          </Text>
          <Text style={[text.caption, { color: color.textSecondary }]}>
            {timeAgo(order.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isPending && onAccept) {
    return (
      <Swipeable renderRightActions={() => renderRightActions(handleAccept)}>
        {cardContent}
      </Swipeable>
    );
  }

  return cardContent;
}
