import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { color, hitSlop, motion, radius, space, switchProps, text, ui } from '@/theme';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  foodItems?: { id: string }[];
}

interface CategoryRowProps {
  item: Category;
  index: number;
  onToggleActive: (id: string, value: boolean) => void;
  onDelete: (id: string, name: string) => void;
}

export function CategoryRow({ item, index, onToggleActive, onDelete }: CategoryRowProps) {
  const router = useRouter();
  const foodCount = item.foodItems?.length ?? 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.base)
        .springify()}
    >
      <View style={[ui.card, { flexDirection: 'row', alignItems: 'center' }]}>
        {/* Icon */}
        <View
          style={[ui.iconTile(44, color.brandSubtle, radius.control), { marginRight: space[3] }]}
        >
          <Ionicons name="grid-outline" size={20} color={color.brand} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={[text.bodyStrong, { color: color.textPrimary }]}>{item.name}</Text>
          <Text style={[text.caption, { color: color.textSecondary, marginTop: space[0.5] }]}>
            {foodCount} item{foodCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ alignItems: 'center', gap: space[2] }}>
          <Switch
            value={item.isActive}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              onToggleActive(item.id, v);
            }}
            {...switchProps}
          />
          <View style={{ flexDirection: 'row', gap: space[2] }}>
            <TouchableOpacity
              onPress={() => router.push(`/category/${item.id}/edit`)}
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
