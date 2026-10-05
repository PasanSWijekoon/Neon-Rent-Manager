import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile, changeUserPassword } from '@/lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.displayName) {
        setName(user.displayName);
      }
      try {
        if (user?.uid) {
          const savedContact = await AsyncStorage.getItem(`@owner_contact_${user.uid}`);
          if (savedContact) setContact(savedContact);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please provide a name.');
      return;
    }

    Alert.alert(
      "Confirm Update",
      "Are you sure you want to update your profile information?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async () => {
            setSavingProfile(true);
            try {
              await updateUserProfile(trimmedName);
              if (user?.uid) {
                await AsyncStorage.setItem(`@owner_contact_${user.uid}`, contact.trim());
              }
              Alert.alert('Success', 'Profile updated successfully.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to update profile.');
            } finally {
              setSavingProfile(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please provide both current and new passwords.');
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password cannot be the same as your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long.');
      return;
    }
    if (!/(?=.*[0-9])/.test(newPassword) || !/(?=.*[a-zA-Z])/.test(newPassword)) {
      Alert.alert('Validation Error', 'New password must contain at least one letter and one number.');
      return;
    }

    Alert.alert(
      "Confirm Password Change",
      "Are you sure you want to change your password? You will need to use the new password next time you log in.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Change Password", 
          style: "destructive",
          onPress: async () => {
            setSavingPassword(true);
            try {
              await changeUserPassword(currentPassword, newPassword);
              Alert.alert('Success', 'Password updated successfully.');
              setCurrentPassword('');
              setNewPassword('');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to update password.');
            } finally {
              setSavingPassword(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Edit Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Info Section */}
        <View className="mb-8">
          <Text className="font-poppins-bold text-lg text-[#1E293B] mb-4">Personal Information</Text>
          
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Display Name</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 mb-4">
            <Feather name="user" size={20} color="#94A3B8" className="mr-3" />
            <TextInput 
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="e.g. Neon Admin"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Contact Number</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 mb-6">
            <Feather name="phone" size={20} color="#94A3B8" className="mr-3" />
            <TextInput 
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="e.g. 077 123 4567"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={contact}
              onChangeText={setContact}
            />
          </View>

          <PrimaryButton 
            title="Save Profile" 
            onPress={handleSaveProfile} 
            loading={savingProfile} 
          />
        </View>

        {/* Security Section */}
        <View className="mb-4 pt-6 border-t border-slate-200">
          <Text className="font-poppins-bold text-lg text-[#1E293B] mb-4">Security</Text>
          
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Current Password</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 mb-4">
            <Feather name="lock" size={20} color="#94A3B8" className="mr-3" />
            <TextInput 
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="Enter current password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">New Password</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 mb-6">
            <Feather name="shield" size={20} color="#94A3B8" className="mr-3" />
            <TextInput 
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="Enter new password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <TouchableOpacity 
            className={`py-3.5 items-center rounded-xl flex-row justify-center ${savingPassword ? 'bg-slate-100' : 'bg-red-50'}`}
            onPress={handleUpdatePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Text className="font-poppins-semibold text-[15px] text-red-600">Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
