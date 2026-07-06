import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { color, motion, press, space, text, ui } from '@/theme';

interface Customer {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  orderCount?: number;
  totalSpent?: number | string;
  createdAt?: string | Date;
}

interface CustomerRowProps {
  item: Customer;
  index: number;
}

export function CustomerRow({ item, index }: CustomerRowProps) {
  const router = useRouter();
  const initials = (item.name ?? item.phone).slice(0, 2).toUpperCase();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.base)
        .springify()}
    >
      <TouchableOpacity
        onPress={() => router.push(`/customer/${item.id}`)}
        activeOpacity={press.card}
        style={[ui.card, { flexDirection: 'row', alignItems: 'center' }]}
      >
        {/* Avatar */}
        <View style={[ui.iconTile(44, color.brandSubtle), { marginRight: space[3] }]}>
          <Text style={[text.emphasis, { color: color.brand }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          {item.name && (
            <Text style={[text.bodyStrong, { color: color.textPrimary, marginBottom: space[0.5] }]}>
              {item.name}
            </Text>
          )}
          <Text style={[text.labelMuted, { color: color.textSecondary }]}>{item.phone}</Text>
        </View>

        {/* Stats */}
        <View style={{ alignItems: 'flex-end', gap: space[1] }}>
          {item.orderCount != null && (
            <View style={ui.badge(color.brandSubtle)}>
              <Text style={[text.overline, { color: color.brand }]}>{item.orderCount} orders</Text>
            </View>
          )}
          {item.totalSpent != null && Number(item.totalSpent) > 0 && (
            <Text style={[text.caption, { color: color.textSecondary }]}>
              ₹{Number(item.totalSpent).toFixed(0)}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={color.textMuted}
          style={{ marginLeft: space[2] }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
