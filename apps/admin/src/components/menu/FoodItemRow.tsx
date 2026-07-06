import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {/* Image */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 56, height: 56, borderRadius: 10, marginRight: 12 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              backgroundColor: '#EEEEF5',
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="image-outline" size={22} color="#C4C9D4" />
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.isVeg ? '#10B981' : '#EF4444',
                marginRight: 6,
                borderWidth: 1,
                borderColor: item.isVeg ? '#10B981' : '#EF4444',
              }}
            />
            <Text
              style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158', flex: 1 }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>

          {item.category && (
            <Text
              style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginBottom: 4 }}
            >
              {item.category.name}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.discountedPrice && Number(item.discountedPrice) > 0 ? (
              <>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 13, color: '#FA7938' }}>
                  ₹{Number(item.discountedPrice).toFixed(0)}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Urbanist',
                    fontSize: 12,
                    color: '#C4C9D4',
                    textDecorationLine: 'line-through',
                  }}
                >
                  ₹{Number(item.price).toFixed(0)}
                </Text>
              </>
            ) : (
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 13, color: '#414158' }}>
                ₹{Number(item.price).toFixed(0)}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Switch
            value={item.isAvailable}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              onToggleAvailability(item.id, v);
            }}
            trackColor={{ false: '#E0E0EA', true: '#FA7938' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push(`/food/${item.id}/edit`)}
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
