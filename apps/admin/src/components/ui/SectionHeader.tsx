import { Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 3,
          height: 18,
          backgroundColor: '#FA7938',
          borderRadius: 2,
          marginRight: 10,
        }}
      />
      <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 16, color: '#414158' }}>
        {title}
      </Text>
    </View>
  );
}
