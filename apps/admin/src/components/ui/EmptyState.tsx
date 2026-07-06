import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(250,121,56,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name={icon} size={40} color="#FA7938" />
      </View>
      <Text
        style={{
          fontFamily: 'Urbanist-SemiBold',
          fontSize: 18,
          color: '#414158',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Urbanist',
          fontSize: 14,
          color: '#9098B1',
          textAlign: 'center',
          maxWidth: 260,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
