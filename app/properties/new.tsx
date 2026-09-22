import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { createProperty } from '@/lib/repositories/properties';

export default function NewPropertyScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedAddress) {
      Alert.alert('Validation Error', 'Please provide both property name and address.');
      return;
    }

    Alert.alert(
      "Confirm Property",
      `Are you sure you want to add "${trimmedName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add Property", 
          onPress: async () => {
            setLoading(true);
            try {
              const now = new Date().toISOString();
              await createProperty(db, {
                id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
                name: trimmedName,
                address: trimmedAddress,
                createdAt: now,
                updatedAt: now,
              });
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to save property.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Add Property</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Property Name</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="home" size={20} color="#94A3B8" className="mr-3" />
            <TextInput
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="e.g. Main Property"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Address</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="map-pin" size={20} color="#94A3B8" className="mr-3" />
            <TextInput
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="e.g. Anuradhapura"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        <PrimaryButton 
          title="Save Property" 
          onPress={handleSave} 
          loading={loading} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}
