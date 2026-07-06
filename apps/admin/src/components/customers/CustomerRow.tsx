import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
      entering={FadeInDown.delay(index * 50)
        .duration(300)
        .springify()}
    >
      <TouchableOpacity
        onPress={() => router.push(`/customer/${item.id}`)}
        activeOpacity={0.85}
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
        {/* Avatar */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFF4EE',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#FA7938' }}>
            {initials}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          {item.name && (
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 14,
                color: '#414158',
                marginBottom: 2,
              }}
            >
              {item.name}
            </Text>
          )}
          <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
            {item.phone}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {item.orderCount != null && (
            <View
              style={{
                backgroundColor: '#FFF4EE',
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 11, color: '#FA7938' }}>
                {item.orderCount} orders
              </Text>
            </View>
          )}
          {item.totalSpent != null && Number(item.totalSpent) > 0 && (
            <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 12, color: '#9098B1' }}>
              ₹{Number(item.totalSpent).toFixed(0)}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color="#C4C9D4" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}
