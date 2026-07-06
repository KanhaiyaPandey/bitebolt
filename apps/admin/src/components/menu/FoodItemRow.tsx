import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { color, font, hitSlop, motion, space, switchProps, text, ui } from '@/theme';

interface FoodItem {
  id: string;
  name: string;
  price: number | string;
  discountedPrice?: number | string | null;
  imageUrl?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  category?: { name: string };
}

interface FoodItemRowProps {
  item: FoodItem;
  index: number;
  onToggleAvailability: (id: string, value: boolean) => void;
  onDelete: (id: string, name: string) => void;
}

export function FoodItemRow({ item, index, onToggleAvailability, onDelete }: FoodItemRowProps) {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.base)
        .springify()}
    >
      <View style={[ui.card, { padding: space[3], flexDirection: 'row', alignItems: 'center' }]}>
        {/* Image */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 56, height: 56, borderRadius: space[2.5], marginRight: space[3] }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: space[2.5],
              backgroundColor: color.track,
              marginRight: space[3],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="image-outline" size={22} color={color.textMuted} />
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[0.5] + 1 }}
          >
            <View
              style={{
                width: space[2.5],
                height: space[2.5],
                borderRadius: space[1.5] - 1,
                backgroundColor: item.isVeg ? color.success : color.error,
                marginRight: space[1.5],
              }}
            />
            <Text
              style={[text.bodyStrong, { color: color.textPrimary, flex: 1 }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>

          {item.category && (
            <Text style={[text.overline, { color: color.textSecondary, marginBottom: space[1] }]}>
              {item.category.name}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[1.5] }}>
            {item.discountedPrice && Number(item.discountedPrice) > 0 ? (
              <>
                <Text style={[text.label, { fontFamily: font.bold, color: color.brand }]}>
                  ₹{Number(item.discountedPrice).toFixed(0)}
                </Text>
                <Text
                  style={[
                    text.caption,
                    { color: color.textMuted, textDecorationLine: 'line-through' },
                  ]}
                >
                  ₹{Number(item.price).toFixed(0)}
                </Text>
              </>
            ) : (
              <Text style={[text.label, { fontFamily: font.bold, color: color.textPrimary }]}>
                ₹{Number(item.price).toFixed(0)}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={{ alignItems: 'center', gap: space[2] }}>
          <Switch
            value={item.isAvailable}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              onToggleAvailability(item.id, v);
            }}
            {...switchProps}
          />
          <View style={{ flexDirection: 'row', gap: space[2] }}>
            <TouchableOpacity
              onPress={() => router.push(`/food/${item.id}/edit`)}
              hitSlop={hitSlop}
            >
              <Ionicons name="pencil-outline" size={18} color={color.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete(item.id, item.name);
              }}
              hitSlop={hitSlop}
            >
              <Ionicons name="trash-outline" size={18} color={color.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
