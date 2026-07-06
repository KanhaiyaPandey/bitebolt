'use client';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { color, elevation, font, motion, opacity, press, radius, space, text } from '@/theme';

export default function OtpScreen() {
  const { phone, devOtp } = useLocalSearchParams<{ phone: string; devOtp?: string }>();
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  // Dev-only: prefill boxes with the OTP the backend returned, so login is one tap.
  const initialOtp =
    __DEV__ && devOtp && devOtp.length === 6 ? devOtp.split('') : ['', '', '', '', '', ''];
  const [otp, setOtp] = useState(initialOtp);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    console.debug('[AdminAuth] Resending OTP');
    try {
      const res = (await authApi.sendOtp(phone)) as { devOtp?: string } | undefined;
      console.debug('[AdminAuth] OTP resent');
      // Dev-only: backend returns devOtp so we can auto-fill and skip Twilio.
      const newDevOtp = __DEV__ ? res?.devOtp : undefined;
      if (newDevOtp && newDevOtp.length === 6) {
        setOtp(newDevOtp.split(''));
      }
      Toast.show({ type: 'success', text1: 'OTP sent again' });
      setCooldown(30);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to resend OTP';
      console.error('[AdminAuth] Resend OTP failed', msg);
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    console.debug('[AdminAuth] Verifying OTP');
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
    <View style={{ flex: 1, backgroundColor: color.brand }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header Area */}
          <View
            style={{
              paddingHorizontal: space[6],
              paddingVertical: space[5],
              alignItems: 'flex-start',
            }}
          >
            <Animated.View entering={FadeInDown.duration(motion.press + 250)}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.full,
                  backgroundColor: `rgba(255,255,255,${opacity.overlay})`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: space[6],
                }}
              >
                <Ionicons name="arrow-back" size={24} color={color.onBrand} />
              </TouchableOpacity>

              <Text style={[text.display, { color: color.onBrand }]}>Enter OTP</Text>
              <Text
                style={[
                  text.bodyLg,
                  { color: color.onBrandMuted, marginTop: space[2], lineHeight: 24 },
                ]}
              >
                We've sent a 6-digit verification code to{'\n'}
                <Text style={[text.bodyLg, { fontFamily: font.bold, color: color.onBrand }]}>
                  +91 {phone}
                </Text>
              </Text>
            </Animated.View>
          </View>

          {/* Bottom Card Area */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(motion.slow).springify()}
            style={[
              {
                flex: 1,
                backgroundColor: color.bg,
                borderTopLeftRadius: radius.hero,
                borderTopRightRadius: radius.hero,
                paddingHorizontal: space[7],
                paddingTop: space[12],
              },
              elevation.sheetTop,
            ]}
          >
            {/* OTP boxes */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: space[6],
              }}
            >
              {otp.map((digit, i) => {
                const isFocused = focusedIndex === i;
                const hasValue = digit.length > 0;
                return (
                  <View
                    key={i}
                    style={[
                      { backgroundColor: color.surface, borderRadius: radius.button },
                      isFocused ? elevation.brandSm : elevation.sm,
                    ]}
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
                      style={[
                        text.h1,
                        {
                          width: 48,
                          height: 56,
                          borderWidth: 2,
                          borderColor: isFocused
                            ? color.brand
                            : hasValue
                              ? color.brand + '66'
                              : 'transparent',
                          borderRadius: radius.button,
                          textAlign: 'center',
                          color: color.textHeading,
                        },
                      ]}
                      autoFocus={i === 0}
                    />
                  </View>
                );
              })}
            </View>

            <View
              style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: space[8] }}
            >
              <Text style={[text.buttonSm, { color: color.textSecondary }]}>
                Didn't receive the code?{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={press.subtle}
                onPress={handleResend}
                disabled={resending || cooldown > 0}
              >
                <Text
                  style={[
                    text.emphasis,
                    { color: resending || cooldown > 0 ? color.textMuted : color.brand },
                  ]}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }} />

            <RNAnimated.View
              style={{
                transform: [{ scale: scaleAnim }],
                paddingBottom: Platform.OS === 'ios' ? space[6] : space[8],
              }}
            >
              <TouchableOpacity
                onPress={handleVerify}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isComplete || loading}
                activeOpacity={press.primary}
                style={[
                  {
                    backgroundColor: isComplete ? color.brand : color.disabled,
                    borderRadius: radius.field,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  isComplete ? elevation.brandLg : elevation.none,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={color.onBrand} size="small" />
                ) : (
                  <Text style={[text.button, { color: color.onBrand }]}>Verify & Login</Text>
                )}
              </TouchableOpacity>
            </RNAnimated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
