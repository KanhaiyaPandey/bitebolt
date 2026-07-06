import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
        {/* Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#FFF4EE',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="grid-outline" size={20} color="#FA7938" />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}>
            {item.name}
          </Text>
          <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1', marginTop: 2 }}>
            {foodCount} item{foodCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Switch
            value={item.isActive}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              onToggleActive(item.id, v);
            }}
            trackColor={{ false: '#E0E0EA', true: '#FA7938' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push(`/category/${item.id}/edit`)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil-outline" size={18} color="#9098B1" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete(item.id, item.name);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
