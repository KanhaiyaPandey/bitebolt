import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      style={{
        backgroundColor: '#FFFFFF',
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F8',
      }}
    >
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginRight: 12, padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color="#414158" />
        </TouchableOpacity>
      )}

      <Text style={{ flex: 1, fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158' }}>
        {title}
      </Text>

      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}
