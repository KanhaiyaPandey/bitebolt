import { Image, Text, View } from 'react-native';

interface PopularItem {
  foodItemId: string;
  name: string;
  imageUrl?: string | null;
  orderCount: number;
  totalRevenue: number;
}

interface PopularItemsProps {
  items: PopularItem[];
}

const RANK_COLORS = ['#FA7938', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export function PopularItems({ items }: PopularItemsProps) {
  return (
    <View style={{ gap: 10 }}>
      {items.slice(0, 5).map((item, i) => (
        <View
          key={item.foodItemId}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 12,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          {/* Rank */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: RANK_COLORS[i] + '22',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 12, color: RANK_COLORS[i] }}>
              {i + 1}
            </Text>
          </View>

          {/* Image */}
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#EEEEF5',
                marginRight: 10,
              }}
            />
          )}

          {/* Name */}
          <Text
            style={{ flex: 1, fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#414158' }}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {/* Count badge */}
          <View
            style={{
              backgroundColor: '#FFF4EE',
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 12, color: '#FA7938' }}>
              {item.orderCount} orders
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
