import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import { useAuthStore } from '../stores/authStore';
import { lightTheme, darkTheme } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useNotifications } from '../hooks/useNotifications';
import { CelebrationProvider } from '../components/celebration';
import { supabase } from '../services/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isLoading, initialize, profile } = useAuthStore();
  const { themeMode } = useThemeStore();

  // Initialize notifications
  useNotifications();

  const [isReady, setIsReady] = useState(false);

  // Determine which theme to use
  const effectiveTheme = themeMode === 'system'
    ? (colorScheme === 'dark' ? darkTheme : lightTheme)
    : (themeMode === 'dark' ? darkTheme : lightTheme);

  // Initialize auth on app start
  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsReady(true);
    };
    init();
  }, [initialize]);

  // Handle deep link for auth (email confirmation, password reset, etc.)
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      // Check if this is an auth callback URL
      if (url.includes('access_token') || url.includes('refresh_token') || url.includes('type=')) {
        try {
          // Extract tokens from URL fragment
          const hashPart = url.split('#')[1];
          if (hashPart) {
            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type = params.get('type');

            if (accessToken && refreshToken) {
              // Set the session in Supabase
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error('Error setting session:', error);
              } else {
                // Re-initialize to fetch updated user data
                await initialize();
              }
            }
          }
        } catch (error) {
          console.error('Error handling deep link:', error);
        }
      }
    };

    // Handle URL when app is opened from a link
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initialize]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (isAuthenticated && inAuthGroup) {
      // User is signed in but on auth screen
      // Check if onboarding is needed
      if (profile && !profile.onboarding_completed) {
        router.replace('/(onboarding)/welcome');
      } else {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && !inOnboardingGroup && profile && !profile.onboarding_completed) {
      // User is authenticated but hasn't completed onboarding
      router.replace('/(onboarding)/welcome');
    } else if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to login
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isReady, isLoading, router, profile]);

  // Show nothing while initializing to prevent flash
  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={effectiveTheme}>
          <CelebrationProvider>
            <StatusBar style={themeMode === 'dark' || (themeMode === 'system' && colorScheme === 'dark') ? 'light' : 'dark'} />
            <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen
              name="transaction/add"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="transaction/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="goals"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="recurring"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="shared"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="insights"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="guides"
              options={{
                headerShown: false,
              }}
            />
            </Stack>
          </CelebrationProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
