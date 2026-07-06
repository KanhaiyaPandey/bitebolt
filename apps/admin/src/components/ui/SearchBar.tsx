import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { color, focus, motion, radius, space, text } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.surface,
        borderRadius: radius.control,
        borderWidth: focus.searchBorderWidth,
        borderColor: focused ? color.brand : color.borderMuted,
        paddingHorizontal: space[3.5],
        height: 46,
        marginHorizontal: space[4],
        marginBottom: space[3],
      }}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={color.textSecondary}
        style={{ marginRight: space[2] }}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[text.body, { flex: 1, color: color.textPrimary }]}
      />
      {value.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
        >
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={18} color={color.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
