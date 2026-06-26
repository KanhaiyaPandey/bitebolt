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
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          borderWidth: selected ? 2.5 : 1,
          borderColor: selected ? '#FA7938' : 'rgba(0,0,0,0.06)',
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: selected ? 0.12 : 0.06,
          shadowRadius: 6,
          elevation: selected ? 3 : 2,
        }}
      >
        {category.imageUrl ? (
          <Image
            source={{ uri: category.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>{getCategoryEmoji(category.name)}</Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: selected ? 'Urbanist-SemiBold' : 'Urbanist-Medium',
          fontSize: 12,
          color: selected ? '#FA7938' : '#414158',
          textAlign: 'center',
          marginTop: 6,
        }}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('burger')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('biryani')) return '🍛';
  if (n.includes('chinese')) return '🥡';
  if (n.includes('dessert') || n.includes('sweet')) return '🍰';
  if (n.includes('drink') || n.includes('beverage')) return '🥤';
  if (n.includes('south')) return '🥘';
  if (n.includes('snack')) return '🍟';
  if (n.includes('veg')) return '🥦';
  return '🍽️';
}
