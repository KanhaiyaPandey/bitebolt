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
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { authApi } from '../../src/api/auth';
import { isValidIndianPhone } from '@bitebolt/utils';

export default function PhoneScreen() {
  const router = useRouter();
  const heroEnter = useRef(new Animated.Value(0)).current;
  const formEnter = useRef(new Animated.Value(0)).current;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.spring(heroEnter, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(formEnter, { toValue: 1, useNativeDriver: true, delay: 120 }).start();
  }, []);

  const handleSendOtp = async () => {
    if (!isValidIndianPhone(phone)) {
      Toast.show({ type: 'error', text1: 'Invalid number', text2: 'Enter a valid 10-digit mobile number' });
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp({ phone });
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (err: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err instanceof Error ? err.message : 'Could not send OTP',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-surface-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Hero gradient */}
      <LinearGradient
        colors={['#FF5722', '#FF8A65']}
        className="h-72 items-center justify-center"
      >
        <Animated.View
          style={{
            opacity: heroEnter,
            transform: [
              {
                translateY: heroEnter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <Text className="text-5xl">🍔</Text>
          <Text className="text-white text-3xl font-bold text-center mt-3">BiteBolt</Text>
          <Text className="text-white/80 text-base text-center mt-1">
            Delicious food, delivered fast
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Form */}
      <Animated.View
        style={{
          opacity: formEnter,
          transform: [
            {
              translateY: formEnter.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
        className="flex-1 bg-white dark:bg-surface-dark rounded-t-3xl -mt-6 px-6 pt-8"
      >
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-1">
          Enter your phone
        </Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark mb-8">
          We'll send you a one-time password to verify
        </Text>

        {/* Phone input */}
        <View className="flex-row items-center bg-surface-card dark:bg-surface-card-dark rounded-input px-4 py-4 mb-6">
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold mr-2 text-base">
            🇮🇳 +91
          </Text>
          <View className="w-px h-5 bg-gray-300 mr-3" />
          <TextInput
            className="flex-1 text-base text-text-primary dark:text-text-primary-dark"
            placeholder="Enter mobile number"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleSendOtp}
          />
        </View>

        <TouchableOpacity
          onPress={handleSendOtp}
          disabled={loading || phone.length !== 10}
          activeOpacity={0.85}
          className={`rounded-button py-4 items-center ${
            phone.length === 10 ? 'bg-brand' : 'bg-gray-200'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`text-base font-semibold ${
                phone.length === 10 ? 'text-white' : 'text-gray-400'
              }`}
            >
              Get OTP
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-center text-text-muted text-xs mt-6 px-4 leading-5">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
