import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/auth.store';
import { maskPhone } from '@bitebolt/utils';

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every(Boolean) && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalOtp = code ?? otp.join('');
    if (finalOtp.length !== 6) return;

    setLoading(true);
    try {
      const data = await authApi.verifyOtp({ phone, otp: finalOtp });
      await setAuth(data.user as never, data.accessToken, data.refreshToken);

      if (data.isNewUser) {
        router.replace('/(auth)/register');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: err instanceof Error ? err.message : 'Please try again',
      });
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authApi.sendOtp({ phone });
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      Toast.show({ type: 'success', text1: 'OTP sent!', text2: `New OTP sent to ${maskPhone(phone)}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to resend OTP' });
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-surface-dark px-6"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity onPress={() => router.back()} className="mt-14 mb-8">
        <Text className="text-2xl">←</Text>
      </TouchableOpacity>

      <Animated.View entering={FadeInDown.springify()}>
        <Text className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          Enter OTP
        </Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark mb-8">
          We sent a 6-digit code to{'\n'}
          <Text className="font-semibold text-text-primary dark:text-text-primary-dark">
            +91 {maskPhone(phone)}
          </Text>
        </Text>

        {/* OTP Boxes */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
              className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold text-text-primary dark:text-text-primary-dark ${
                digit ? 'border-brand' : 'border-gray-200'
              } bg-surface-card dark:bg-surface-card-dark`}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => handleVerify()}
          disabled={loading || otp.some((d) => !d)}
          activeOpacity={0.85}
          className={`rounded-button py-4 items-center mb-6 ${
            otp.every(Boolean) ? 'bg-brand' : 'bg-gray-200'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-semibold ${otp.every(Boolean) ? 'text-white' : 'text-gray-400'}`}>
              Verify OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} className="items-center">
          <Text className="text-text-secondary dark:text-text-secondary-dark">
            Didn't receive OTP?{' '}
            <Text className={`font-semibold ${resendTimer === 0 ? 'text-brand' : 'text-text-muted'}`}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
            </Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
