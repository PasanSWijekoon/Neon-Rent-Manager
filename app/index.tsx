import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#F8FAFC' }} />;
  }
  
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
