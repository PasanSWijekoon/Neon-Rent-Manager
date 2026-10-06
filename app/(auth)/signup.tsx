import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { signUp } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export default function SignUpScreen() {
  const router = useRouter();
  const { setIsNewLogin, triggerProfileRefresh, setUser } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      setIsNewLogin(true); // Trigger welcome animation before firebase fires onAuthStateChanged
        const newUser = await signUp(trimmedEmail, password, trimmedName);
        setUser({...newUser} as any); // Force a new object reference into Zustand so React sees the updated displayName
        triggerProfileRefresh();
      // The auth observer in App layout will automatically navigate to (tabs)
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
      setLoading(false); // Only set to false on error, success will unmount screen
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Feather name="arrow-left" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text className="font-poppins-semibold text-lg text-[#1E293B]">Create Account</Text>
          </View>

          <View className="flex-1 px-6 pt-8 pb-6">
            <View className="mb-8">
              <Text className="font-poppins-bold text-[28px] text-[#1E293B] mb-2 leading-tight">
                Join Neon Rent
              </Text>
              <Text className="font-poppins-medium text-[15px] text-slate-500">
                Manage your properties with ease.
              </Text>
            </View>

            <View>
              <View className="mb-5">
                <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-2">Full Name</Text>
                <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14">
                  <Feather name="user" size={20} color="#94A3B8" className="mr-3" />
                  <TextInput 
                    className="flex-1 font-poppins-medium text-[15px] text-[#1E293B] py-0 h-full"
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                    editable={!loading}
                  />
                </View>
              </View>

              <View className="mb-5">
                <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-2">Email Address</Text>
                <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14">
                  <Feather name="mail" size={20} color="#94A3B8" className="mr-3" />
                  <TextInput 
                    className="flex-1 font-poppins-medium text-[15px] text-[#1E293B] py-0 h-full"
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
              </View>

              <View className="mb-5">
                <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-2">Password</Text>
                <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14">
                  <Feather name="lock" size={20} color="#94A3B8" className="mr-3" />
                  <TextInput 
                    className="flex-1 font-poppins-medium text-[15px] text-[#1E293B] py-0 h-full"
                    placeholder="Create a password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2" disabled={loading}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={showPassword ? colors.primary : "#94A3B8"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-5">
                <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-2">Confirm Password</Text>
                <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14">
                  <Feather name="check-circle" size={20} color="#94A3B8" className="mr-3" />
                  <TextInput 
                    className="flex-1 font-poppins-medium text-[15px] text-[#1E293B] py-0 h-full"
                    placeholder="Confirm your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2" disabled={loading}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={showPassword ? colors.primary : "#94A3B8"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-4">
                <PrimaryButton 
                  title="Create Account" 
                  onPress={handleSignUp} 
                  loading={loading} 
                />
              </View>

              <View className="flex-row items-center justify-center pt-2 pb-6">
                <Text className="font-poppins-medium text-sm text-slate-500">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()} className="py-2">
                  <Text className="font-poppins-semibold text-sm text-primary">Sign In</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Seamless transition bridge to dashboard */}
      {loading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginBottom: 24 }} />
          <Text className="font-poppins-medium text-white text-lg">Creating Account...</Text>
          <Text className="font-poppins-regular text-blue-200 text-sm mt-2">Setting up your workspace</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
