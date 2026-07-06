import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        minWidth: 160,
        marginRight: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
        marginBottom: 8, // space for shadow
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: color + '1A', // 10% opacity
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>

      <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 32, color: '#1A1A2E', lineHeight: 38 }}>
        {value}
      </Text>
      <Text
        style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#9098B1', marginTop: 4 }}
      >
        {label}
      </Text>
    </View>
  );
}
