'use client';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated as RNAnimated,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { authApi } from '@/api';
import { useAdminAuthStore } from '@/store/auth.store';

export default function OtpScreen() {
  const { phone, devOtp } = useLocalSearchParams<{ phone: string; devOtp?: string }>();
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  // Dev-only: prefill boxes with the OTP the backend returned, so login is one tap.
  const initialOtp =
    __DEV__ && devOtp && devOtp.length === 6 ? devOtp.split('') : ['', '', '', '', '', ''];
  const [otp, setOtp] = useState(initialOtp);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const otpValue = otp.join('');
  const isComplete = otpValue.length === 6;

  const handlePressIn = () => {
    if (isComplete && !loading) {
      RNAnimated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    RNAnimated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    console.debug('[AdminAuth] Verifying OTP', { phone });
    try {
      const result = await authApi.verifyOtp(phone, otpValue);
      console.debug('[AdminAuth] OTP verified, role check', { role: result.user?.role });

      await setAuth(result.user, result.accessToken, result.refreshToken);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid OTP';
      console.error('[AdminAuth] OTP verification failed', msg);
      Toast.show({ type: 'error', text1: msg });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FA7938' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header Area */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 20, alignItems: 'flex-start' }}>
            <Animated.View entering={FadeInDown.duration(500)}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>

              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 32, color: '#FFF' }}>
                Enter OTP
              </Text>
              <Text
                style={{
                  fontFamily: 'Urbanist-Medium',
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: 8,
                  lineHeight: 24,
                }}
              >
                We've sent a 6-digit verification code to{'\n'}
                <Text style={{ fontFamily: 'Urbanist-Bold', color: '#FFF' }}>+91 {phone}</Text>
              </Text>
            </Animated.View>
          </View>

          {/* Bottom Card Area */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600).springify()}
            style={{
              flex: 1,
              backgroundColor: '#FAFBFC',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 28,
              paddingTop: 48,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* OTP boxes */}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}
            >
              {otp.map((digit, i) => {
                const isFocused = focusedIndex === i;
                const hasValue = digit.length > 0;
                return (
                  <View
                    key={i}
                    style={{
                      shadowColor: isFocused ? '#FA7938' : '#000',
                      shadowOffset: { width: 0, height: isFocused ? 4 : 2 },
                      shadowOpacity: isFocused ? 0.2 : 0.04,
                      shadowRadius: isFocused ? 8 : 4,
                      elevation: isFocused ? 4 : 1,
                      backgroundColor: '#FFF',
                      borderRadius: 14,
                    }}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[i] = ref;
                      }}
                      value={digit}
                      onChangeText={(v) => handleChange(v, i)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                      onFocus={() => setFocusedIndex(i)}
                      onBlur={() => setFocusedIndex(-1)}
                      keyboardType="number-pad"
                      maxLength={1}
                      style={{
                        width: 48,
                        height: 56,
                        borderWidth: 2,
                        borderColor: isFocused
                          ? '#FA7938'
                          : hasValue
                            ? 'rgba(250, 121, 56, 0.4)'
                            : 'transparent',
                        borderRadius: 14,
                        textAlign: 'center',
                        fontSize: 24,
                        fontFamily: 'Urbanist-Bold',
                        color: '#1A1A2E',
                      }}
                      autoFocus={i === 0}
                    />
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Urbanist-Medium', fontSize: 15, color: '#9098B1' }}>
                Didn't receive the code?{' '}
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#FA7938' }}>
                  Resend
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }} />

            <RNAnimated.View
              style={{
                transform: [{ scale: scaleAnim }],
                paddingBottom: Platform.OS === 'ios' ? 24 : 32,
              }}
            >
              <TouchableOpacity
                onPress={handleVerify}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isComplete || loading}
                activeOpacity={0.9}
                style={{
                  backgroundColor: isComplete ? '#FA7938' : '#D3D6DE',
                  borderRadius: 16,
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FA7938',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isComplete ? 0.25 : 0,
                  shadowRadius: 16,
                  elevation: isComplete ? 8 : 0,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#FFF' }}>
                    Verify & Login
                  </Text>
                )}
              </TouchableOpacity>
            </RNAnimated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
