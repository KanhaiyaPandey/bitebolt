import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  {
    name: 'index',
    label: 'Home',
    icon: 'bar-chart-outline' as const,
    iconActive: 'bar-chart' as const,
  },
  {
    name: 'orders',
    label: 'Orders',
    icon: 'receipt-outline' as const,
    iconActive: 'receipt' as const,
  },
  {
    name: 'menu',
    label: 'Menu',
    icon: 'restaurant-outline' as const,
    iconActive: 'restaurant' as const,
  },
  {
    name: 'customers',
    label: 'Clients',
    icon: 'people-outline' as const,
    iconActive: 'people' as const,
  },
  {
    name: 'payments',
    label: 'Finance',
    icon: 'card-outline' as const,
    iconActive: 'card' as const,
  },
];

function TabBarIcon({ name, label, focused }: { name: string; label: string; focused: boolean }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const dotScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(focused ? 1.15 : 1, {
      duration: 300,
      easing: Easing.out(Easing.back(1.5)),
    });
    translateY.value = withTiming(focused ? -4 : 0, {
      duration: 300,
      easing: Easing.out(Easing.back(1.5)),
    });
    dotScale.value = withTiming(focused ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.back(2)),
    });
  }, [focused, scale, translateY, dotScale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const tab = TABS.find((t) => t.name === name);
  if (!tab) return null;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 44 }}>
      <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
        <Ionicons
          name={focused ? tab.iconActive : tab.icon}
          size={22}
          color={focused ? '#FA7938' : '#A0AABF'}
        />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: focused ? 'Urbanist-Bold' : 'Urbanist-Medium',
            fontSize: 10,
            color: focused ? '#FA7938' : '#A0AABF',
            marginTop: 3,
          }}
        >
          {label}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#FA7938',
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  const tabBarHeight = 68 + bottomPad;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 16,
            right: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            height: tabBarHeight - 10,
            borderTopWidth: 0,
            elevation: 14,
            shadowColor: '#1A1A24',
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -2 },
            paddingBottom: bottomPad,
            paddingTop: 0,
          },
          tabBarItemStyle: {
            paddingTop: 25,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon name="index" label="Home" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="orders" label="Orders" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon name="menu" label="Menu" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="customers" label="Clients" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="payments" label="Finance" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
