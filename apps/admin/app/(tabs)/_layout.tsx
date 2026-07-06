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

import { color, elevation, font, fontSize, layout, motion, radius, space } from '@/theme';

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
      duration: motion.base,
      easing: Easing.out(Easing.back(1.5)),
    });
    translateY.value = withTiming(focused ? -space[1] : 0, {
      duration: motion.base,
      easing: Easing.out(Easing.back(1.5)),
    });
    dotScale.value = withTiming(focused ? 1 : 0, {
      duration: motion.base,
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
          color={focused ? color.brand : color.navInactive}
        />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: focused ? font.bold : font.medium,
            fontSize: fontSize.tiny,
            color: focused ? color.brand : color.navInactive,
            marginTop: space[0.5] + 1,
          }}
        >
          {label}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -space[1],
            width: space[1],
            height: space[1],
            borderRadius: space[0.5],
            backgroundColor: color.brand,
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
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: layout.screenX,
            right: layout.screenX,
            backgroundColor: color.surface,
            borderRadius: radius.panel,
            height: tabBarHeight - space[2.5],
            borderTopWidth: 0,
            paddingBottom: bottomPad,
            paddingTop: 0,
            ...elevation.navBar,
          },
          tabBarItemStyle: {
            paddingTop: space[6] + 1,
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
