import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLogo } from '@/components/ui/AppLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { signIn } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setIsNewLogin } = useAuthStore();

  // Focus states for modern active styling
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setIsNewLogin(true); // Flag that this is a fresh login for the animation!
      await signIn(email.trim(), password);
    } catch (e: any) {
      setIsNewLogin(false);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 }}>
            <View className="items-center mb-10">
              <AppLogo size={80} />
              <Text className="font-poppins-bold text-[28px] text-[#1E293B] mt-6 text-center">
                Neon Rent Manager
              </Text>
              <Text className="font-poppins-regular text-[16px] text-slate-500 mt-2 text-center">
                Simple Rent & Tenant Management
              </Text>
            </View>

            <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm" style={{ shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 15, elevation: 4 }}>
              {error && (
                <View className="bg-red-50 p-3.5 rounded-xl mb-5 flex-row items-center border border-red-100">
                  <Feather name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text className="text-red-600 font-poppins-medium text-[13px] flex-1 mt-0.5">{error}</Text>
                </View>
              )}

              <View className="mb-5">
                <Text className="font-poppins-semibold text-slate-700 text-[13px] mb-2 ml-1 tracking-wide">
                  Email Address
                </Text>
                <View 
                  className={`flex-row items-center h-14 bg-slate-50 border rounded-xl px-4 ${emailFocused ? 'border-primary bg-blue-50/30' : 'border-slate-200'}`}
                >
                  <Feather name="mail" size={20} color={emailFocused ? colors.primary : '#94A3B8'} style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 font-poppins-regular text-[#1E293B] text-[15px] py-0"
                    style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}
                    placeholder="admin@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              <View className="mb-8">
                <Text className="font-poppins-semibold text-slate-700 text-[13px] mb-2 ml-1 tracking-wide">
                  Password
                </Text>
                <View 
                  className={`flex-row items-center h-14 bg-slate-50 border rounded-xl px-4 ${passwordFocused ? 'border-primary bg-blue-50/30' : 'border-slate-200'}`}
                >
                  <Feather name="lock" size={20} color={passwordFocused ? colors.primary : '#94A3B8'} style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 font-poppins-regular text-[#1E293B] text-[15px] py-0"
                    style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2 -mr-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={showPassword ? colors.primary : "#94A3B8"} />
                  </TouchableOpacity>
                </View>
              </View>

              <PrimaryButton 
                title="Sign In" 
                onPress={handleSignIn} 
                loading={loading} 
              />
            </View>
          </View>
          
          <Text className="text-center font-poppins-medium text-[11px] text-slate-400 mb-6">
            Version {appVersion}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Seamless transition bridge to dashboard */}
      {loading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginBottom: 24 }} />
          <Text className="font-poppins-medium text-white text-lg">Authenticating...</Text>
          <Text className="font-poppins-regular text-blue-200 text-sm mt-2">Connecting to Neon Rent Manager</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
