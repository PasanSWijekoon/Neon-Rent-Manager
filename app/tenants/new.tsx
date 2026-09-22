import React, { useState } from 'react';
import {  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator , Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { createTenant } from '@/lib/repositories/tenants';
import { Tenant } from '@/types/tenant';

export default function NewTenantScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please provide a tenant name.');
      return;
    }

    const trimmedPhone = phone.trim();
    const digitCount = trimmedPhone.replace(/\D/g, '').length;
    if (trimmedPhone && digitCount > 10) {
      Alert.alert('Validation Error', 'Phone number cannot exceed 10 digits.');
      return;
    }

    Alert.alert(
      "Confirm",
      `Are you sure you want to add "${trimmedName}" as a new tenant?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            setSaving(true);
            try {
              const now = new Date().toISOString();
              const newTenant: Tenant = {
                id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
                name: trimmedName,
                phone: phone.trim() || null,
                address: address.trim() || null,
                notes: notes.trim() || null,
                createdAt: now,
                updatedAt: now,
                archivedAt: null,
              };

              await createTenant(db, newTenant);
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Unable to save tenant.');
              setSaving(false);
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
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">New Tenant</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        
        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Tenant Name *</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="user" size={20} color="#94A3B8" className="mr-3" />
            <TextInput style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="e.g. Pasan"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Phone (Optional)</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="phone" size={20} color="#94A3B8" className="mr-3" />
            <TextInput style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="e.g. 071 234 5678"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Address (Optional)</Text>
          <View className="flex-row items-start bg-white border border-slate-200 rounded-xl px-4 py-3 min-h-[80px]">
            <Feather name="map-pin" size={20} color="#94A3B8" className="mr-3 mt-1" />
            <TextInput style={{ marginTop: Platform.OS === 'android' ? 4 : 0 }}
              className="py-0 flex-1 font-poppins-regular text-[#1E293B]"
              placeholder="Tenant's address"
              placeholderTextColor="#94A3B8"
              multiline
              value={address}
              onChangeText={setAddress}
             textAlignVertical="top"/>
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Notes (Optional)</Text>
          <View className="flex-row items-start bg-white border border-slate-200 rounded-xl px-4 py-3 min-h-[100px]">
            <Feather name="file-text" size={20} color="#94A3B8" className="mr-3 mt-1" />
            <TextInput style={{ marginTop: Platform.OS === 'android' ? 4 : 0 }}
              className="py-0 flex-1 font-poppins-regular text-[#1E293B]"
              placeholder="Any extra details..."
              placeholderTextColor="#94A3B8"
              multiline
              value={notes}
              onChangeText={setNotes}
             textAlignVertical="top"/>
          </View>
        </View>

        <PrimaryButton 
          title="Save Tenant" 
          onPress={handleSave} 
          loading={saving} 
        />
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
