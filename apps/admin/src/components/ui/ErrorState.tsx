import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { color, font, press, radius, space, text, ui } from '@/theme';

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
        paddingVertical: space[14],
        paddingHorizontal: space[8],
      }}
    >
      <View style={[ui.iconTile(80, color.error + '1F'), { marginBottom: space[5] }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={color.error} />
      </View>
      <Text
        style={[
          text.h3,
          {
            fontFamily: font.semibold,
            color: color.textPrimary,
            textAlign: 'center',
            marginBottom: space[2],
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          text.body,
          {
            color: color.textSecondary,
            textAlign: 'center',
            maxWidth: 260,
            marginBottom: onRetry ? space[5] : 0,
          },
        ]}
      >
        {subtitle}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={press.card}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[2],
            backgroundColor: color.brand,
            borderRadius: radius.button,
            paddingHorizontal: space[6],
            paddingVertical: space[3],
          }}
        >
          <Ionicons name="refresh" size={18} color={color.onBrand} />
          <Text style={[text.buttonSm, { color: color.onBrand }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
