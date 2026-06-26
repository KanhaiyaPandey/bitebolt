import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/auth.store';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  color?: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && !isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FA793820',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="person-outline" size={36} color="#FA7938" />
          </View>
          <Text
            style={{
              fontFamily: 'Urbanist-Bold',
              fontSize: 22,
              color: '#414158',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Sign in to view your profile
          </Text>
          <Text
            style={{
              fontFamily: 'Urbanist',
              fontSize: 14,
              color: '#9098B1',
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            Log in to manage your account, orders, and preferences.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/phone')}
            style={{
              backgroundColor: '#FA7938',
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 40,
              alignItems: 'center',
              shadowColor: '#FA7938',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Order status steps
  const ORDER_STEPS = [
    { icon: 'cube-outline' as IoniconsName, label: 'Pending' },
    { icon: 'restaurant-outline' as IoniconsName, label: 'Preparing' },
    { icon: 'home-outline' as IoniconsName, label: 'At Door' },
    { icon: 'bicycle-outline' as IoniconsName, label: 'On Way' },
    { icon: 'checkmark-circle-outline' as IoniconsName, label: 'Done' },
  ];

  const MENU_ITEMS: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Personal Info',
      onPress: () => router.push('/personal-info'),
    },
    { icon: 'receipt-outline', label: 'My Orders', onPress: () => router.push('/(tabs)/orders') },
    { icon: 'card-outline', label: 'Payment Info', onPress: () => {} },
    { icon: 'location-outline', label: 'Addresses', onPress: () => router.push('/addresses') },
    { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'log-out-outline', label: 'Sign Out', color: '#EF4444', onPress: () => logout() },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}
        >
          <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 22, color: '#414158' }}>
            My Account
          </Text>
        </Animated.View>

        {/* ── Profile card ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={{ paddingHorizontal: 20, marginBottom: 20 }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FA793820',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 28 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 17, color: '#414158' }}>
                {user?.name ?? 'Foodie'}
              </Text>
              <Text
                style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1', marginTop: 2 }}
              >
                {user?.phone ?? '+1 234 567 890'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/personal-info')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#EEEEF5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="pencil-outline" size={16} color="#FA7938" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Order status tracker ──────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={{ paddingHorizontal: 20, marginBottom: 20 }}
        >
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginBottom: 14,
            }}
          >
            Order Status
          </Text>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 18,
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {ORDER_STEPS.map((step, idx) => (
                <View key={step.label} style={{ alignItems: 'center', flex: 1 }}>
                  {/* Icon */}
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: idx <= 1 ? '#FA793820' : '#EEEEF5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: idx === 1 ? 2 : 0,
                      borderColor: idx === 1 ? '#FA7938' : 'transparent',
                    }}
                  >
                    <Ionicons name={step.icon} size={18} color={idx <= 1 ? '#FA7938' : '#C4C9D4'} />
                  </View>
                  {/* Connector line */}
                  {idx < ORDER_STEPS.length - 1 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 19,
                        left: '60%',
                        right: '-60%',
                        height: 2,
                        backgroundColor: idx < 1 ? '#FA7938' : '#D3D6DE',
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Settings menu ─────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={{ paddingHorizontal: 20 }}
        >
          <Text
            style={{
              fontFamily: 'Urbanist-SemiBold',
              fontSize: 16,
              color: '#414158',
              marginBottom: 14,
            }}
          >
            Setting Preferences
          </Text>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {MENU_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  borderBottomWidth: idx < MENU_ITEMS.length - 1 ? 1 : 0,
                  borderBottomColor: '#F4F4FA',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: item.color ? item.color + '18' : '#EEEEF5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name={item.icon} size={18} color={item.color ?? '#FA7938'} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Urbanist-Medium',
                    fontSize: 15,
                    flex: 1,
                    color: item.color ?? '#414158',
                  }}
                >
                  {item.label}
                </Text>
                {!item.color && <Ionicons name="chevron-forward" size={18} color="#C4C9D4" />}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
