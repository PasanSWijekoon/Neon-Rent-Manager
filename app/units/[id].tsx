import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getUnitById, updateUnit } from '@/lib/repositories/units';
import { getProperty } from '@/lib/repositories/properties';
import { Unit, UnitStatus } from '@/types/unit';
import { Property } from '@/types/property';

export default function EditUnitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState<UnitStatus>('vacant');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const u = await getUnitById(db, id);
        if (u) {
          setUnit(u);
          setName(u.name);
          setStatus(u.status);
          
          const p = await getProperty(db, u.propertyId);
          setProperty(p);
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
      Alert.alert('Validation Error', 'Please provide a unit name.');
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
              await updateUnit(db, id, {
                name: trimmedName,
                status,
                updatedAt: now,
              });
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to update unit.');
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

  if (!unit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Error</Text>
        </View>
        <Text className="text-center font-poppins-medium text-slate-500 mt-10">Unit not found.</Text>
      </SafeAreaView>
    );
  }

  const isShop = unit.type === 'shop';
  const icon = isShop ? 'briefcase' : 'home';
  const typeLabel = isShop ? 'Shop' : 'Hostel Room';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Unit Details</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        
        <View className="mb-6 flex-row items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isShop ? 'bg-purple-100' : 'bg-blue-100'}`}>
            <Feather name={icon} size={20} color={isShop ? '#9333EA' : '#3B82F6'} />
          </View>
          <View>
            <Text className="font-poppins-semibold text-base text-[#1E293B]">{typeLabel}</Text>
            <Text className="font-poppins-regular text-xs text-slate-500">Property: {property?.name || 'Loading...'}</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Unit Name</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="tag" size={20} color="#94A3B8" className="mr-3" />
            <TextInput
              className="flex-1 font-poppins-regular text-[#1E293B] h-full"
              placeholder="e.g. Room 101"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Occupancy Status</Text>
          <View className="flex-row">
            <TouchableOpacity 
              className={`flex-1 py-3 items-center rounded-xl border mr-3 ${status === 'vacant' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}
              onPress={() => setStatus('vacant')}
            >
              <Text className={`font-poppins-semibold text-sm ${status === 'vacant' ? 'text-emerald-700' : 'text-slate-500'}`}>Vacant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 py-3 items-center rounded-xl border ${status === 'occupied' ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}
              onPress={() => setStatus('occupied')}
            >
              <Text className={`font-poppins-semibold text-sm ${status === 'occupied' ? 'text-blue-700' : 'text-slate-500'}`}>Occupied</Text>
            </TouchableOpacity>
          </View>
        </View>

        <PrimaryButton 
          title="Update Unit" 
          onPress={handleSave} 
          loading={saving} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}
