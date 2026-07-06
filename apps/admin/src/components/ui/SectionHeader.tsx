import { Text, View } from 'react-native';

import { color, radius, space, text } from '@/theme';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: space[4],
        paddingVertical: space[3],
      }}
    >
      <View
        style={{
          width: 3,
          height: 18,
          backgroundColor: color.brand,
          borderRadius: radius.none + 2,
          marginRight: space[2.5],
        }}
      />
      <Text style={[text.titleMd, { color: color.textPrimary }]}>{title}</Text>
    </View>
  );
}
