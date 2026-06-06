import '../src/styles/global.css';
import { useEffect, useState } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '../src/store/auth.store';
import AnimatedSplash from '../src/components/AnimatedSplash';

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
  useEffect(() => { initialize(); }, []);
  return null;
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  // Map Inter variants to Urbanist names so all screens work now.
  // Once `@expo-google-fonts/urbanist` is installed (run `pnpm install`
  // in apps/mobile) swap these imports for the Urbanist equivalents.
  const [fontsLoaded] = useFonts({
    Urbanist:           Inter_400Regular,
    'Urbanist-Medium':  Inter_500Medium,
    'Urbanist-SemiBold':Inter_600SemiBold,
    'Urbanist-Bold':    Inter_700Bold,
    // keep originals available too
    Inter:              Inter_400Regular,
    'Inter-Medium':     Inter_500Medium,
    'Inter-SemiBold':   Inter_600SemiBold,
    'Inter-Bold':       Inter_700Bold,
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
