import React, { useState, useEffect } from 'react';
import {  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator , Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getTenant, updateTenant } from '@/lib/repositories/tenants';
import { Tenant } from '@/types/tenant';

export default function EditTenantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const t = await getTenant(db, id);
        if (t) {
          setTenant(t);
          setName(t.name);
          setPhone(t.phone || '');
          setAddress(t.address || '');
          setNotes(t.notes || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, db]);

  const handleSave = async () => {
    if (!id) return;
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
      "Confirm Update",
      `Are you sure you want to update the details for "${trimmedName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async () => {
            setSaving(true);
            try {
              const now = new Date().toISOString();
              await updateTenant(db, id, {
                name: trimmedName,
                phone: phone.trim() || null,
                address: address.trim() || null,
                notes: notes.trim() || null,
                updatedAt: now,
              });
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Unable to update tenant.');
              setSaving(false);
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

  if (!tenant) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Error</Text>
        </View>
        <Text className="text-center font-poppins-medium text-slate-500 mt-10">Tenant not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Edit Tenant</Text>
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
          title="Update Tenant" 
          onPress={handleSave} 
          loading={saving} 
        />
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
