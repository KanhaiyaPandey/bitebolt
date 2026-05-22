import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useCartStore } from '../../src/store/cart.store';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1">
      <Text className={`text-2xl ${focused ? 'opacity-100' : 'opacity-50'}`}>{emoji}</Text>
      <Text className={`text-[10px] mt-0.5 ${focused ? 'text-brand font-semibold' : 'text-gray-400'}`}>
        {label}
      </Text>
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
          height: 70,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          backgroundColor: '#fff',
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Search" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon emoji="🛒" label="Cart" focused={focused} />
              {itemCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-brand rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-white text-[9px] font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
