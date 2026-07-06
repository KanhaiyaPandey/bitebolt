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
    <View style={{ flex: 1, backgroundColor: '#FA7938' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header Area */}
          <View style={{ paddingHorizontal: 28, paddingVertical: 40, alignItems: 'center' }}>
            <Animated.View entering={FadeInDown.duration(600).springify()}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 5,
                }}
              >
                <Ionicons name="shield-checkmark" size={32} color="#FFF" />
              </View>
            </Animated.View>
            <Animated.Text
              entering={FadeInDown.delay(100).duration(600).springify()}
              style={{
                fontFamily: 'Urbanist-Bold',
                fontSize: 32,
                color: '#FFF',
                textAlign: 'center',
              }}
            >
              BiteBolt Admin
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(150).duration(600).springify()}
              style={{
                fontFamily: 'Urbanist-Medium',
                fontSize: 16,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Secure Operations Panel
            </Animated.Text>
          </View>

          {/* Bottom Card Area */}
          <Animated.View
            entering={FadeInUp.delay(250).duration(600).springify()}
            style={{
              flex: 1,
              backgroundColor: '#FAFBFC',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 28,
              paddingTop: 40,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Text
              style={{
                fontFamily: 'Urbanist-SemiBold',
                fontSize: 18,
                color: '#1A1A2E',
                marginBottom: 12,
              }}
            >
              Phone Number
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: isFocused
                  ? '#FA7938'
                  : phone.length > 0 && isValid
                    ? '#FA7938'
                    : 'transparent',
                paddingHorizontal: 20,
                height: 60,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Urbanist-Bold',
                  fontSize: 16,
                  color: '#9098B1',
                  marginRight: 12,
                }}
              >
                +91
              </Text>
              <View style={{ width: 1, height: 24, backgroundColor: '#E0E5ED', marginRight: 12 }} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#A0AABF"
                style={{ flex: 1, fontFamily: 'Urbanist-Medium', fontSize: 16, color: '#1A1A2E' }}
              />
              {isValid && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </Animated.View>
              )}
            </View>

            <Text
              style={{
                fontFamily: 'Urbanist-Medium',
                fontSize: 14,
                color: '#9098B1',
                marginTop: 16,
                lineHeight: 20,
              }}
            >
              An OTP will be sent to verify your secure admin access.
            </Text>

            <View style={{ flex: 1 }} />

            <RNAnimated.View
              style={{
                transform: [{ scale: scaleAnim }],
                paddingBottom: Platform.OS === 'ios' ? 24 : 32,
              }}
            >
              <TouchableOpacity
                onPress={handleSendOtp}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isValid || loading}
                activeOpacity={0.9}
                style={{
                  backgroundColor: isValid ? '#FA7938' : '#D3D6DE',
                  borderRadius: 16,
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FA7938',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isValid ? 0.25 : 0,
                  shadowRadius: 16,
                  elevation: isValid ? 8 : 0,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#FFF' }}>
                    Continue
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
