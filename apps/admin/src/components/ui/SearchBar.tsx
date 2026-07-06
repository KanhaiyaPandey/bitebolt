import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: focused ? '#FA7938' : '#E8E8F0',
        paddingHorizontal: 14,
        height: 46,
        marginHorizontal: 16,
        marginBottom: 12,
      }}
    >
      <Ionicons name="search-outline" size={18} color="#9098B1" style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4C9D4"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, fontFamily: 'Urbanist', fontSize: 14, color: '#414158' }}
      />
      {value.length > 0 && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={18} color="#9098B1" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
