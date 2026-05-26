import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
          Search
        </Text>
        {!!params.categoryId && (
          <Text className="text-text-secondary text-sm mt-1">
            Category: {params.categoryId}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
