import { Redirect, Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { pushSync } from '@/lib/sync';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

function CustomTabBar({ state, descriptors, navigation }: any) {
  // ... existing CustomTabBar code ...
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 12,
      paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
      paddingHorizontal: 16,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine icon and label
        let iconName = '';
        let label = '';
        if (route.name === 'index') {
          iconName = isFocused ? 'home-variant' : 'home-variant-outline';
          label = 'Home';
        } else if (route.name === 'units') {
          iconName = isFocused ? 'office-building' : 'office-building-outline';
          label = 'Units';
        } else if (route.name === 'payments') {
          iconName = isFocused ? 'credit-card' : 'credit-card-outline';
          label = 'Payments';
        } else if (route.name === 'history') {
          iconName = 'history';
          label = 'History';
        }

        const color = isFocused ? colors.primary : colors.textSecondary;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View 
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? '#EFF6FF' : 'transparent',
                borderRadius: 16, // Rounded rectangle instead of a pill
                overflow: 'hidden',
                paddingVertical: 8,
                paddingHorizontal: isFocused ? 16 : 8,
              }}
            >
              <MaterialCommunityIcons name={iconName as any} size={24} color={color} />
              <Text 
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontSize: 10, color: color, marginTop: 4, fontFamily: 'Poppins_600SemiBold' }}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuthStore();
  const db = useSQLiteContext();

  useEffect(() => {
    if (!user) return;
    
    // Sync immediately when the dashboard layout mounts
    pushSync(db).catch(console.error);

    // Sync silently whenever the user opens the app from the background
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        pushSync(db).catch(console.error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [db, user]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="units" />
      <Tabs.Screen name="payments" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}
