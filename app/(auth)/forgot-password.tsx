import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Please provide an email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(trimmedEmail);
      Alert.alert(
        'Email Sent', 
        'If an account exists with that email, a password reset link has been sent.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Feather name="arrow-left" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text className="font-poppins-semibold text-lg text-[#1E293B]">Reset Password</Text>
          </View>

          <View className="flex-1 px-6 pt-10 pb-6">
            <View className="mb-8 items-center">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-6">
                <Feather name="key" size={32} color={colors.primary} />
              </View>
              <Text className="font-poppins-bold text-2xl text-[#1E293B] mb-3 text-center">
                Forgot Password?
              </Text>
              <Text className="font-poppins-medium text-[15px] text-slate-500 text-center leading-relaxed">
                No worries! Enter your registered email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            <View>
              <View className="mb-6">
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

              <View className="mt-2">
                <PrimaryButton 
                  title="Send Reset Link" 
                  onPress={handleReset} 
                  loading={loading} 
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
