import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
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
                paddingHorizontal: isFocused ? 20 : 12,
              }}
            >
              <MaterialCommunityIcons name={iconName as any} size={24} color={color} />
              <Text style={{ fontSize: 10, color: color, marginTop: 4, fontFamily: 'Poppins_600SemiBold' }}>
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
