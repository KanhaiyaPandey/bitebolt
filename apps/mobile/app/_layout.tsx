import '../src/styles/global.css';
import { useEffect } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '../src/store/auth.store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard() {
  const { isAuthenticated, isRegistered, isLoading, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/phone');
    } else if (isAuthenticated && !isRegistered) {
      router.replace('/(auth)/register');
    } else if (isAuthenticated && isRegistered && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRegistered, isLoading]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="food/[slug]"
          options={{ headerShown: true, title: '', presentation: 'card' }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ headerShown: true, title: 'Order Details', presentation: 'card' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ headerShown: true, title: 'Checkout', presentation: 'modal' }}
        />
      </Stack>
      <Toast />
    </QueryClientProvider>
  );
}
