import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/auth.store';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const enterAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.spring(enterAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Toast.show({ type: 'error', text1: 'Name required', text2: 'Please enter your name to continue' });
      return;
    }

    setLoading(true);
    try {
      const dto: { name: string; email?: string } = { name: trimmedName };
      if (email.trim()) dto.email = email.trim();

      const data = await authApi.register(dto);
      setUser(data as never);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-surface-dark px-6"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        className="flex-1 justify-center"
        style={{
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        }}
      >
        <Text className="text-4xl mb-4">👋</Text>
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          Welcome to BiteBolt!
        </Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark mb-10">
          Just a few details to get you started.
        </Text>

        <Text className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
          Your name *
        </Text>
        <TextInput
          className="bg-surface-card dark:bg-surface-card-dark rounded-input px-4 py-4 text-base text-text-primary dark:text-text-primary-dark mb-4"
          placeholder="e.g. Rahul Sharma"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          autoCapitalize="words"
        />

        <Text className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
          Email (optional)
        </Text>
        <TextInput
          className="bg-surface-card dark:bg-surface-card-dark rounded-input px-4 py-4 text-base text-text-primary dark:text-text-primary-dark mb-8"
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading || !name.trim()}
          activeOpacity={0.85}
          className={`rounded-button py-4 items-center ${
            name.trim() ? 'bg-brand' : 'bg-gray-200'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-semibold ${name.trim() ? 'text-white' : 'text-gray-400'}`}>
              Let's go!
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
