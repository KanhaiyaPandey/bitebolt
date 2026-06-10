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
import { SafeAreaView } from 'react-native-safe-area-context';
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
      Toast.show({
        type: 'error',
        text1: 'Name required',
        text2: 'Please enter your name to continue',
      });
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

  const isReady = name.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1, paddingHorizontal: 20 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View
            style={{
              flex: 1,
              justifyContent: 'center',
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
            {/* Header */}
            <View style={{ marginBottom: 36 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: '#FA793820',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 26 }}>👋</Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Urbanist-Bold',
                  fontSize: 26,
                  color: '#414158',
                  marginBottom: 8,
                }}
              >
                Welcome to BiteBolt!
              </Text>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', lineHeight: 22 }}
              >
                Just a couple of details and you're all set.
              </Text>
            </View>

            {/* Form card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
                marginBottom: 20,
              }}
            >
              {/* Name */}
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: '#9098B1',
                  marginBottom: 8,
                }}
              >
                YOUR NAME *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#EEEEF5',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontFamily: 'Urbanist',
                  fontSize: 15,
                  color: '#414158',
                  marginBottom: 16,
                }}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#C4C9D4"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                autoCapitalize="words"
              />

              {/* Email */}
              <Text
                style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 13,
                  color: '#9098B1',
                  marginBottom: 8,
                }}
              >
                EMAIL <Text style={{ fontFamily: 'Urbanist', color: '#C4C9D4' }}>(optional)</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#EEEEF5',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontFamily: 'Urbanist',
                  fontSize: 15,
                  color: '#414158',
                }}
                placeholder="you@example.com"
                placeholderTextColor="#C4C9D4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading || !isReady}
              activeOpacity={0.85}
              style={{
                backgroundColor: isReady ? '#FA7938' : '#EEEEF5',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: isReady ? '#FA7938' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: isReady ? 5 : 0,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 16,
                    color: isReady ? '#FFFFFF' : '#9098B1',
                  }}
                >
                  Let's go!
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
