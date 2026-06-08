import type { Category } from '@bitebolt/types';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface CategoryChipProps {
  category: Category;
  onPress: () => void;
  selected?: boolean;
}

export function CategoryChip({ category, onPress, selected }: CategoryChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ alignItems: 'center', width: 72 }}
    >
      {/* Icon container */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          backgroundColor: selected ? '#FA7938' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: selected ? 0 : 0.06,
          shadowRadius: 6,
          elevation: selected ? 0 : 2,
        }}
      >
        {category.imageUrl ? (
          <Image
            source={{ uri: category.imageUrl }}
            style={{ width: 34, height: 34 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 26 }}>{getCategoryEmoji(category.name)}</Text>
        )}
      </View>

      {/* Label */}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'Urbanist-Medium',
          fontSize: 12,
          color: selected ? '#FA7938' : '#414158',
          textAlign: 'center',
        }}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('meal') || n.includes('food')) return '🍕';
  if (n.includes('shop') || n.includes('store')) return '🛍️';
  if (n.includes('drug') || n.includes('pharma') || n.includes('med')) return '💊';
  if (n.includes('drink') || n.includes('beverage')) return '🥤';
  if (n.includes('burger')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('sushi')) return '🍣';
  if (n.includes('dessert') || n.includes('sweet')) return '🍰';
  if (n.includes('fruit')) return '🍓';
  if (n.includes('veg')) return '🥦';
  return '🍽️';
}
