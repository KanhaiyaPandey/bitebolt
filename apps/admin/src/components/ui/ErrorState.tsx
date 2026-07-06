import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  subtitle = 'We could not load this data. Please try again.',
  onRetry,
}: ErrorStateProps) {
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
          backgroundColor: 'rgba(239,68,68,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={40} color="#EF4444" />
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
          marginBottom: onRetry ? 20 : 0,
        }}
      >
        {subtitle}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FA7938',
            borderRadius: 14,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#FFF' }}>
            Retry
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
