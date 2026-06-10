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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/auth.store';
import { maskPhone } from '@bitebolt/utils';

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuth } = useAuthStore();

  const enterAnim = useRef(new Animated.Value(0)).current;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    Animated.spring(enterAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

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
      Toast.show({
        type: 'success',
        text1: 'OTP sent!',
        text2: `New OTP sent to ${maskPhone(phone)}`,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to resend OTP' });
    }
  };

  const allFilled = otp.every(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1, paddingHorizontal: 20 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 8,
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#414158" />
          </TouchableOpacity>

          <Animated.View
            style={{
              flex: 1,
              justifyContent: 'center',
              opacity: enterAnim,
              transform: [
                {
                  translateY: enterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <Text
              style={{
                fontFamily: 'Urbanist-Bold',
                fontSize: 26,
                color: '#414158',
                marginBottom: 10,
              }}
            >
              Enter OTP
            </Text>
            <Text
              style={{
                fontFamily: 'Urbanist',
                fontSize: 14,
                color: '#9098B1',
                marginBottom: 36,
                lineHeight: 22,
              }}
            >
              We sent a 6-digit code to{'\n'}
              <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#414158' }}>
                +91 {maskPhone(phone)}
              </Text>
            </Text>

            {/* OTP boxes */}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 }}
            >
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    inputs.current[i] = ref;
                  }}
                  style={{
                    width: 48,
                    height: 56,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: digit ? '#FA7938' : '#E2E4EA',
                    backgroundColor: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: 20,
                    fontFamily: 'Urbanist-Bold',
                    color: '#414158',
                  }}
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
              disabled={loading || !allFilled}
              activeOpacity={0.85}
              style={{
                backgroundColor: allFilled ? '#FA7938' : '#EEEEF5',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: allFilled ? '#FA7938' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: allFilled ? 5 : 0,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    fontSize: 16,
                    color: allFilled ? '#FFFFFF' : '#9098B1',
                  }}
                >
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResend}
              disabled={resendTimer > 0}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1' }}>
                Didn't receive OTP?{' '}
                <Text
                  style={{
                    fontFamily: 'Urbanist-SemiBold',
                    color: resendTimer === 0 ? '#FA7938' : '#C4C9D4',
                  }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
