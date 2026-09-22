import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getProperty, updateProperty } from '@/lib/repositories/properties';
import { Property } from '@/types/property';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const p = await getProperty(db, id);
        if (p) {
          setProperty(p);
          setName(p.name);
          setAddress(p.address);
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
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedAddress) {
      Alert.alert('Validation Error', 'Please provide both property name and address.');
      return;
    }

    Alert.alert(
      "Confirm Update",
      `Are you sure you want to update "${trimmedName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async () => {
            setSaving(true);
            try {
              const now = new Date().toISOString();
              await updateProperty(db, id, {
                name: trimmedName,
                address: trimmedAddress,
                updatedAt: now,
              });
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to update property.');
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

  if (!property) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Error</Text>
        </View>
        <Text className="text-center font-poppins-medium text-slate-500 mt-10">Property not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Edit Property</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Property Name</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="home" size={20} color="#94A3B8" className="mr-3" />
            <TextInput
              className="flex-1 font-poppins-regular text-[#1E293B] h-full"
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
              className="flex-1 font-poppins-regular text-[#1E293B] h-full"
              placeholder="e.g. Anuradhapura"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        <PrimaryButton 
          title="Update Property" 
          onPress={handleSave} 
          loading={saving} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}
