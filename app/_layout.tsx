import "../global.css";
import { Stack } from "expo-router";
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

import { observeAuthState } from '../lib/auth';
import { useAuthStore } from '../store/authStore';
import { SQLiteProvider } from 'expo-sqlite';
import { initDatabase, DB_NAME } from '../lib/database';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loading: authLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = observeAuthState((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      if (!authLoading) {
        SplashScreen.hideAsync();
      }
    }
  }, [loaded, error, authLoading]);

  if (!loaded && !error) {
    return null;
  }

  // We no longer return a blank View here because unmounting the <Stack> 
  // breaks expo-router's ability to navigate when authLoading becomes false.
  // The native Splash Screen will cover the screen until we are ready anyway!

  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={initDatabase}>
      <StatusBar style="auto" />
      <NavigationBar style="auto" />
      <Stack screenOptions={{ 
        headerShown: false, 
        animation: 'none',
        contentStyle: { backgroundColor: '#F8FAFC' } 
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </SQLiteProvider>
  );
}
