import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../src/store/cart.store';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  icon: IoniconsName;
  iconFocused: IoniconsName;
  focused: boolean;
  isHome?: boolean;
  badgeCount?: number;
}

function TabIcon({ icon, iconFocused, focused, isHome, badgeCount }: TabIconProps) {
  if (isHome) {
    return (
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: '#FA7938',
          alignItems: 'center',
          justifyContent: 'center',
          // subtle lift shadow on the orange pill
          shadowColor: '#FA7938',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
          marginBottom: Platform.OS === 'ios' ? 4 : 0,
        }}
      >
        <Ionicons name={iconFocused} size={26} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={focused ? iconFocused : icon}
        size={24}
        color={focused ? '#FA7938' : '#9098B1'}
      />
      {(badgeCount ?? 0) > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: '#FA7938',
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
            {(badgeCount ?? 0) > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 72,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="home-outline"
              iconFocused="home"
              focused={focused}
              isHome
            />
          ),
        }}
      />

      {/* Hide search — now a modal on the home screen */}
      <Tabs.Screen name="search" options={{ href: null }} />

      {/* Cart */}
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="cart-outline"
              iconFocused="cart"
              focused={focused}
              badgeCount={itemCount}
            />
          ),
        }}
      />

      {/* Orders / notifications */}
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="notifications-outline"
              iconFocused="notifications"
              focused={focused}
            />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="person-outline"
              iconFocused="person"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
