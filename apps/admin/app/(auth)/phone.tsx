'use client';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { color, elevation, motion, opacity, press, radius, space, text } from '@/theme';

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const isValid = /^[6-9]\d{9}$/.test(phone);

  const handlePressIn = () => {
    if (isValid && !loading) {
      RNAnimated.spring(scaleAnim, {
        toValue: press.scaleDown,
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

  const handleSendOtp = async () => {
    if (!isValid) {
      Toast.show({ type: 'error', text1: 'Enter a valid 10-digit phone number' });
      return;
    }
    setLoading(true);
    console.debug('[AdminAuth] Sending OTP');
    try {
      const res = (await authApi.sendOtp(phone)) as { devOtp?: string } | undefined;
      console.debug('[AdminAuth] OTP sent');
      // Dev-only: backend returns devOtp so we can auto-fill and skip Twilio.
      const devOtp = __DEV__ ? res?.devOtp : undefined;
      router.push({ pathname: '/(auth)/otp', params: { phone, ...(devOtp ? { devOtp } : {}) } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send OTP';
      console.error('[AdminAuth] Send OTP failed', msg);
      Toast.show({ type: 'error', text1: msg });
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
              paddingHorizontal: space[7],
              paddingVertical: space[10],
              alignItems: 'center',
            }}
          >
            <Animated.View entering={FadeInDown.duration(motion.slow).springify()}>
              <View
                style={[
                  {
                    width: 64,
                    height: 64,
                    borderRadius: radius.field,
                    backgroundColor: `rgba(255,255,255,${opacity.overlayStrong})`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: space[5],
                  },
                  elevation.md,
                ]}
              >
                <Ionicons name="shield-checkmark" size={32} color={color.onBrand} />
              </View>
            </Animated.View>
            <Animated.Text
              entering={FadeInDown.delay(100).duration(motion.slow).springify()}
              style={[text.display, { color: color.onBrand, textAlign: 'center' }]}
            >
              BiteBolt Admin
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(150).duration(motion.slow).springify()}
              style={[
                text.bodyLg,
                { color: color.onBrandMuted, marginTop: space[2], textAlign: 'center' },
              ]}
            >
              Secure Operations Panel
            </Animated.Text>
          </View>

          {/* Bottom Card Area */}
          <Animated.View
            entering={FadeInUp.delay(250).duration(motion.slow).springify()}
            style={[
              {
                flex: 1,
                backgroundColor: color.bg,
                borderTopLeftRadius: radius.hero,
                borderTopRightRadius: radius.hero,
                paddingHorizontal: space[7],
                paddingTop: space[10],
              },
              elevation.sheetTop,
            ]}
          >
            <Text style={[text.h3, { color: color.textHeading, marginBottom: space[3] }]}>
              Phone Number
            </Text>

            <View
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: color.surface,
                  borderRadius: radius.field,
                  borderWidth: 2,
                  borderColor:
                    isFocused || (phone.length > 0 && isValid) ? color.brand : 'transparent',
                  paddingHorizontal: space[5],
                  height: 60,
                },
                elevation.sm,
              ]}
            >
              <Text style={[text.bodyLg, { color: color.textSecondary, marginRight: space[3] }]}>
                +91
              </Text>
              <View
                style={{
                  width: 1,
                  height: 24,
                  backgroundColor: color.borderMuted,
                  marginRight: space[3],
                }}
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="Enter 10-digit number"
                placeholderTextColor={color.navInactive}
                style={[text.bodyLg, { flex: 1, color: color.textHeading }]}
              />
              {isValid && (
                <Animated.View entering={FadeInDown.duration(motion.base)}>
                  <Ionicons name="checkmark-circle" size={24} color={color.success} />
                </Animated.View>
              )}
            </View>

            <Text style={[text.body, { color: color.textSecondary, marginTop: space[4] }]}>
              An OTP will be sent to verify your secure admin access.
            </Text>

            <View style={{ flex: 1 }} />

            <RNAnimated.View
              style={{
                transform: [{ scale: scaleAnim }],
                paddingBottom: Platform.OS === 'ios' ? space[6] : space[8],
              }}
            >
              <TouchableOpacity
                onPress={handleSendOtp}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isValid || loading}
                activeOpacity={press.primary}
                style={[
                  {
                    backgroundColor: isValid ? color.brand : color.disabled,
                    borderRadius: radius.field,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  isValid ? elevation.brandLg : elevation.none,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={color.onBrand} size="small" />
                ) : (
                  <Text style={[text.button, { color: color.onBrand }]}>Continue</Text>
                )}
              </TouchableOpacity>
            </RNAnimated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
