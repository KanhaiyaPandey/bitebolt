import { View, Text, TouchableOpacity, Image } from 'react-native';
import type { Category } from '@bitebolt/types';

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
      className={`items-center mr-3 w-20 ${selected ? 'opacity-100' : 'opacity-80'}`}
    >
      <View
        className={`w-16 h-16 rounded-2xl items-center justify-center mb-1.5 ${
          selected ? 'bg-brand' : 'bg-surface-card dark:bg-surface-card-dark'
        }`}
      >
        {category.imageUrl ? (
          <Image source={{ uri: category.imageUrl }} className="w-10 h-10" resizeMode="contain" />
        ) : (
          <Text className="text-3xl">🍽️</Text>
        )}
      </View>
      <Text
        className={`text-xs text-center font-medium ${
          selected ? 'text-brand font-bold' : 'text-text-secondary dark:text-text-secondary-dark'
        }`}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}
