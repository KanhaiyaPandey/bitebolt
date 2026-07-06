import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { color, font, space, text, ui } from '@/theme';

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
        paddingVertical: space[14],
        paddingHorizontal: space[8],
      }}
    >
      <View style={[ui.iconTile(80, color.brand + '1F'), { marginBottom: space[5] }]}>
        <Ionicons name={icon} size={40} color={color.brand} />
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
      <Text style={[text.body, { color: color.textSecondary, textAlign: 'center', maxWidth: 260 }]}>
        {subtitle}
      </Text>
    </View>
  );
}
