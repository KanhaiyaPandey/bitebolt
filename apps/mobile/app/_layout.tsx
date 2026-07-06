import '../src/styles/global.css';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import { usersApi } from '../src/api';
import AnimatedSplash from '../src/components/AnimatedSplash';
import { registerForPushNotificationsAsync } from '../src/notifications/push';
import { useAuthStore } from '../src/store/auth.store';
import { useGuestCartStore } from '../src/store/guest-cart.store';

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

function InitAuth() {
  const initialize = useAuthStore((s) => s.initialize);
  const hydrateGuestCart = useGuestCartStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    initialize();
    hydrateGuestCart();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotificationsAsync().then((token) => {
      if (token) usersApi.registerPushToken(token).catch(() => {});
    });
  }, [isAuthenticated]);

  return null;
}

function PushNotificationListener() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { orderId?: string };
      if (data?.orderId) {
        router.push(`/order/${data.orderId}`);
      } else {
        router.push('/notifications');
      }
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  // Map Inter variants to Urbanist names so all screens work now.
  // Once `@expo-google-fonts/urbanist` is installed (run `pnpm install`
  // in apps/mobile) swap these imports for the Urbanist equivalents.
  const [fontsLoaded] = useFonts({
    Urbanist: Inter_400Regular,
    'Urbanist-Medium': Inter_500Medium,
    'Urbanist-SemiBold': Inter_600SemiBold,
    'Urbanist-Bold': Inter_700Bold,
    // keep originals available too
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={splashDone ? 'dark' : 'light'} />
      <InitAuth />
      <PushNotificationListener />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <Toast />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </QueryClientProvider>
  );
}
