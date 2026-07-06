import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StatusBadge } from './StatusBadge';

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
      activeOpacity={0.85}
      style={{
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 16,
        marginBottom: 12,
        marginLeft: 8,
      }}
    >
      <Ionicons name="checkmark-circle" size={28} color="#FFF" />
      <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 11, color: '#FFF', marginTop: 2 }}>
        Accept
      </Text>
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
      entering={FadeInDown.delay(index * 60)
        .duration(350)
        .springify()}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/order/${order.id}`)}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 14,
          marginHorizontal: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ flex: 1, fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158' }}>
            #{order.orderNumber}
          </Text>
          <StatusBadge status={order.status} size="sm" />
        </View>

        {/* Customer name */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="person-outline" size={13} color="#9098B1" style={{ marginRight: 5 }} />
          <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
            {order.user?.name ?? order.user?.phone ?? 'Unknown'}
          </Text>
        </View>

        {/* Items */}
        {itemsPreview && (
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#C4C9D4', marginBottom: 8 }}
          >
            {itemsPreview}
          </Text>
        )}

        {/* Bottom row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#FA7938' }}>
            ₹{Number(order.total).toFixed(2)}
          </Text>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>
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
