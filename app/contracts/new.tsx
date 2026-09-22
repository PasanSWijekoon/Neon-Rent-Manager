import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Href, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { createContract, checkContractOverlap } from '@/lib/repositories/contracts';
import { getTenants } from '@/lib/repositories/tenants';
import { getUnitById, updateUnit } from '@/lib/repositories/units';
import { Tenant } from '@/types/tenant';
import { Unit } from '@/types/unit';
import { Contract } from '@/types/contract';

export default function NewContractScreen() {
  const router = useRouter();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const db = useSQLiteContext();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState<Unit | null>(null);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [rent, setRent] = useState('');
  const [notes, setNotes] = useState('');

  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);

  const onValueChange = (event: any, selectedDate?: Date) => {
    setDatePickerMode(null);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      if (datePickerMode === 'start') {
        setStartDate(dateString);
      } else if (datePickerMode === 'end') {
        setEndDate(dateString);
      }
    }
  };

  const onDismiss = () => {
    setDatePickerMode(null);
  };

  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        if (!unitId) return;
        try {
          const u = await getUnitById(db, unitId);
          if (u) {
            setUnit(u);
          }
          const ts = await getTenants(db);
          const activeTenants = ts
            .filter(t => !t.archivedAt)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTenants(activeTenants);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }, [unitId, db])
  );

  const validateDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
  };

  const handleSave = async () => {
    if (!unitId) return;
    if (!selectedTenant) {
      Alert.alert('Validation Error', 'Please select a tenant.');
      return;
    }
    if (!startDate || !validateDate(startDate)) {
      Alert.alert('Validation Error', 'Please enter a valid start date (YYYY-MM-DD).');
      return;
    }
    if (!endDate || !validateDate(endDate)) {
      Alert.alert('Validation Error', 'Please enter a valid end date (YYYY-MM-DD).');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert('Validation Error', 'End date cannot be before start date.');
      return;
    }
    
    const rentNum = parseInt(rent.replace(/\D/g, ''), 10);
    if (isNaN(rentNum) || rentNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rent greater than 0.');
      return;
    }

    Alert.alert(
      "Confirm Contract",
      `Are you sure you want to create a contract for ${selectedTenant.name} at LKR ${rentNum.toLocaleString()} per month?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Create", 
          onPress: async () => {
            setSaving(true);
            try {
              const isOverlap = await checkContractOverlap(db, unitId, startDate, endDate);
              if (isOverlap) {
                Alert.alert('Contract Overlap', 'This unit already has a contract covering part of this period.');
                setSaving(false);
                return;
              }

              const now = new Date().toISOString();
              const newContract: Contract = {
                id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
                unitId,
                tenantId: selectedTenant.id,
                startDate,
                endDate,
                monthlyRent: rentNum,
                dueDay: 1, // Defaulting for now
                deposit: 0,
                status: 'active',
                notes: notes.trim() || null,
                createdAt: now,
                updatedAt: now,
              };

              await createContract(db, newContract);
              await updateUnit(db, unitId, { status: 'occupied', updatedAt: now });
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Unable to create contract.');
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
        <Text className="text-center font-poppins-medium text-slate-500 mt-10">Unit not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">New Contract</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View className="mb-6 flex-row items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${unit.type === 'shop' ? 'bg-purple-100' : 'bg-blue-100'}`}>
            <Feather name={unit.type === 'shop' ? 'briefcase' : 'home'} size={20} color={unit.type === 'shop' ? '#9333EA' : '#3B82F6'} />
          </View>
          <View>
            <Text className="font-poppins-semibold text-base text-[#1E293B]">{unit.name}</Text>
            <Text className="font-poppins-regular text-xs text-slate-500">
              {unit.type === 'shop' ? 'Shop' : 'Hostel Room'}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Tenant *</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 h-14"
            onPress={() => setTenantModalVisible(true)}
          >
            <View className="flex-row items-center">
              <Feather name="user" size={20} color="#94A3B8" className="mr-3" />
              <Text className={`font-poppins-regular ${selectedTenant ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                {selectedTenant ? selectedTenant.name : 'Select a tenant'}
              </Text>
            </View>
            <Feather name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View className="flex-row mb-6">
          <View className="flex-1 mr-2">
            <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Start Date *</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14"
              onPress={() => setDatePickerMode('start')}
            >
              <Feather name="calendar" size={16} color="#94A3B8" className="mr-2" />
              <Text className={`flex-1 font-poppins-regular text-xs ${startDate ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                {startDate || 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-1 ml-2">
            <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">End Date *</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14"
              onPress={() => setDatePickerMode('end')}
            >
              <Feather name="calendar" size={16} color="#94A3B8" className="mr-2" />
              <Text className={`flex-1 font-poppins-regular text-xs ${endDate ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                {endDate || 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Monthly Rent (LKR) *</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Text className="font-poppins-semibold text-slate-400 mr-2">Rs.</Text>
            <TextInput
              className="flex-1 font-poppins-semibold text-[#1E293B] py-0"
              placeholder="15000"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={rent}
              onChangeText={setRent}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Notes (Optional)</Text>
          <View className="flex-row items-start bg-white border border-slate-200 rounded-xl px-4 py-3 min-h-[100px]">
            <Feather name="file-text" size={20} color="#94A3B8" className="mr-3 mt-1" />
            <TextInput
              className="py-0 flex-1 font-poppins-regular text-[#1E293B]"
              placeholder="Contract details..."
              placeholderTextColor="#94A3B8"
              multiline
              value={notes}
              onChangeText={setNotes}
             textAlignVertical="top"/>
          </View>
        </View>

        <PrimaryButton 
          title="Create Contract" 
          onPress={handleSave} 
          loading={saving} 
        />
      </ScrollView>

      {/* Tenant Picker Modal */}
      <Modal visible={tenantModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-5 pb-8 h-[75%]">
            <View className="px-6 flex-row justify-between items-center mb-4">
              <Text className="font-poppins-bold text-xl text-[#1E293B]">Select Tenant</Text>
              <TouchableOpacity onPress={() => setTenantModalVisible(false)} className="p-2">
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {tenants.length > 0 && (
              <View className="px-6 mb-4">
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                  <Feather name="search" size={18} color="#94A3B8" className="mr-3" />
                  <TextInput
                    className="flex-1 font-poppins-regular text-[#1E293B] py-0"
                    placeholder="Search tenant by name..."
                    placeholderTextColor="#94A3B8"
                    value={tenantSearch}
                    onChangeText={setTenantSearch}
                  />
                  {tenantSearch ? (
                    <TouchableOpacity onPress={() => setTenantSearch('')}>
                      <Feather name="x-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
            
            <ScrollView className="px-4">
              {tenants.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="font-poppins-medium text-slate-500 mb-4">No active tenants available.</Text>
                  <TouchableOpacity 
                    className="bg-blue-50 px-6 py-3 rounded-full"
                    onPress={() => {
                      setTenantModalVisible(false);
                      router.push('/tenants/new' as Href);
                    }}
                  >
                    <Text className="text-blue-600 font-poppins-semibold text-sm">Add New Tenant</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                (() => {
                  const filtered = tenants
                    .filter(t => t.name.toLowerCase().includes(tenantSearch.toLowerCase()))
                    .slice(0, tenantSearch ? undefined : 10);
                    
                  if (filtered.length === 0) {
                    return (
                      <View className="items-center py-10">
                        <Text className="font-poppins-medium text-slate-500">No matching tenants found.</Text>
                      </View>
                    );
                  }

                  return filtered.map(t => (
                    <TouchableOpacity 
                      key={t.id}
                      className="flex-row items-center p-4 border-b border-slate-100"
                      onPress={() => {
                        setSelectedTenant(t);
                        setTenantModalVisible(false);
                        setTenantSearch(''); // Reset search on select
                      }}
                    >
                      <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                        <Feather name="user" size={16} color="#10B981" />
                      </View>
                      <View>
                        <Text className="font-poppins-semibold text-[#1E293B] text-base">{t.name}</Text>
                        {t.phone && <Text className="font-poppins-regular text-xs text-slate-500">{t.phone}</Text>}
                      </View>
                    </TouchableOpacity>
                  ));
                })()
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {datePickerMode && (
        <DateTimePicker
          value={datePickerMode === 'start' && startDate ? new Date(startDate) : (datePickerMode === 'end' && endDate ? new Date(endDate) : new Date())}
          mode="date"
          display="default"
          onValueChange={onValueChange}
          onDismiss={onDismiss}
        />
      )}
    </SafeAreaView>
  );
}
