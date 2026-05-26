import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface-dark" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
          Food
        </Text>
        <Text className="text-text-secondary text-sm mt-2">Slug: {slug}</Text>
      </View>

      <View className="px-5">
        <TouchableOpacity onPress={() => router.back()} className="bg-brand rounded-button px-6 py-3 self-start">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
