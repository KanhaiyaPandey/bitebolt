import { Image, Text, View } from 'react-native';

import { color, elevation, palette, radius, space, text, ui } from '@/theme';

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

const RANK_COLORS = [color.brand, color.warning, color.success, color.info, palette.violet500];

export function PopularItems({ items }: PopularItemsProps) {
  return (
    <View style={{ gap: space[2.5] }}>
      {items.slice(0, 5).map((item, i) => (
        <View
          key={item.foodItemId}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: color.surface,
              borderRadius: radius.control,
              padding: space[3],
            },
            elevation.sm,
          ]}
        >
          {/* Rank */}
          <View style={[ui.iconTile(28, RANK_COLORS[i] + '22'), { marginRight: space[2.5] }]}>
            <Text style={[text.captionStrong, { color: RANK_COLORS[i] }]}>{i + 1}</Text>
          </View>

          {/* Image */}
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 40, height: 40, borderRadius: space[2], marginRight: space[2.5] }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: space[2],
                backgroundColor: color.track,
                marginRight: space[2.5],
              }}
            />
          )}

          {/* Name */}
          <Text style={[text.label, { flex: 1, color: color.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Count badge */}
          <View style={[ui.badge(color.brandSubtle), { paddingHorizontal: space[2.5] }]}>
            <Text style={[text.captionStrong, { color: color.brand }]}>
              {item.orderCount} orders
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
