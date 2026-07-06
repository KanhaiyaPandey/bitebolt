import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, press, space, text, ui } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, showBack = false, rightElement }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        ui.screenHeader(insets.top - space[1]),
        { flexDirection: 'row', alignItems: 'center' },
      ]}
    >
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={press.subtle}
          style={{ marginRight: space[3], padding: space[1] }}
        >
          <Ionicons name="arrow-back" size={22} color={color.textPrimary} />
        </TouchableOpacity>
      )}

      <Text style={[text.h2, { flex: 1, color: color.textPrimary }]}>{title}</Text>

      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}
