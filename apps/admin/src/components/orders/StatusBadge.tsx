import { Text, View } from 'react-native';

import { orderTone, space, text, ui } from '@/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const tone = orderTone(status);

  return (
    <View
      style={[
        ui.badge(tone.bg),
        size === 'md' && { paddingHorizontal: space[3], paddingVertical: space[1] + 1 },
      ]}
    >
      <Text style={[size === 'sm' ? text.overline : text.captionStrong, { color: tone.text }]}>
        {tone.label}
      </Text>
    </View>
  );
}
