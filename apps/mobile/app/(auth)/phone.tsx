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
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { authApi } from '../../src/api/auth';
import { isValidIndianPhone } from '@bitebolt/utils';

export default function PhoneScreen() {
  const router = useRouter();
  const heroAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, delay: 120 }).start();
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

  const isReady = phone.length === 10;

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEF5' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 8,
              marginLeft: 20,
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

          {/* Brand area */}
          <Animated.View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: '#FA7938',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                shadowColor: '#FA7938',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.28,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="flash" size={34} color="#FFFFFF" />
            </View>
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 28, color: '#414158' }}>
              BiteBolt
            </Text>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 15, color: '#9098B1', marginTop: 6 }}>
              Delicious food, delivered fast
            </Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: Platform.OS === 'ios' ? 36 : 28,
              opacity: formAnim,
              transform: [
                {
                  translateY: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 22, color: '#414158', marginBottom: 6 }}>
              Enter your phone
            </Text>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', marginBottom: 24 }}>
              We'll send a one-time password to verify your number
            </Text>

            {/* Phone input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EEEEF5',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#414158', marginRight: 10 }}>
                🇮🇳 +91
              </Text>
              <View style={{ width: 1, height: 20, backgroundColor: '#D3D6DE', marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, fontFamily: 'Urbanist', fontSize: 15, color: '#414158' }}
                placeholder="10-digit mobile number"
                placeholderTextColor="#C4C9D4"
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
                <Text style={{
                  fontFamily: 'Urbanist-SemiBold',
                  fontSize: 16,
                  color: isReady ? '#FFFFFF' : '#9098B1',
                }}>
                  Get OTP
                </Text>
              )}
            </TouchableOpacity>

            <Text style={{
              fontFamily: 'Urbanist',
              fontSize: 12,
              color: '#C4C9D4',
              textAlign: 'center',
              marginTop: 20,
              lineHeight: 18,
            }}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
