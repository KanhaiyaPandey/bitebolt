import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { color, space, text, ui } from '@/theme';

interface MetricCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent hue from `chartColors` — tints the icon tile. */
  accent: string;
}

export function MetricCard({ label, value, icon, accent }: MetricCardProps) {
  return (
    <View style={[ui.panel, { minWidth: 160, marginRight: space[4], marginBottom: space[2] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space[4] }}>
        <View style={ui.iconTile(44, accent + '1A')}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
      </View>

      <Text style={[text.display, { color: color.textHeading }]}>{value}</Text>
      <Text style={[text.label, { color: color.textSecondary, marginTop: space[1] }]}>{label}</Text>
    </View>
  );
}
