import React, { useState, useEffect } from 'react';
import {  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator , Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getUnitById, updateUnit } from '@/lib/repositories/units';
import { getProperty } from '@/lib/repositories/properties';
import { getContractsForUnit } from '@/lib/repositories/contracts';
import { getTenant } from '@/lib/repositories/tenants';
import { Unit, UnitStatus } from '@/types/unit';
import { Property } from '@/types/property';
import { Contract } from '@/types/contract';
import { Tenant } from '@/types/tenant';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';

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

  const [contracts, setContracts] = useState<(Contract & { tenant: Tenant | null })[]>([]);

  const [rentPeriods, setRentPeriods] = useState<any[]>([]);

  const loadData = React.useCallback(async () => {
    if (!id) return;
    try {
      const u = await getUnitById(db, id);
      if (u) {
        setUnit(u);
        setName(u.name);
        setStatus(u.status);
        
        const p = await getProperty(db, u.propertyId);
        setProperty(p);

        const cons = await getContractsForUnit(db, u.id);
        const consWithTenants = await Promise.all(
          cons.map(async (c) => {
            const t = await getTenant(db, c.tenantId);
            return { ...c, tenant: t };
          })
        );
        setContracts(consWithTenants);

        const activeContract = cons.find(c => c.status === 'active');
        if (activeContract) {
          const { getRentPeriodsForContract } = require('@/lib/repositories/rentPeriods');
          const periods = await getRentPeriodsForContract(db, activeContract.id);
          setRentPeriods(periods.slice(0, 3)); // show top 3 recent
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, db]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

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
            <TextInput style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
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

        {rentPeriods.length > 0 && (
          <View className="mt-8 mb-2">
            <Text className="font-poppins-bold text-lg text-[#1E293B] mb-4">Recent Rent</Text>
            {rentPeriods.map(rp => (
              <TouchableOpacity key={rp.id} onPress={() => router.push(`/rent/${rp.id}` as Href)}>
                <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-0.5">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][rp.periodMonth - 1]} {rp.periodYear}
                      </Text>
                      <Text className="font-poppins-medium text-xs text-slate-400">
                        Rent: LKR {rp.amountDue.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-poppins-bold text-sm text-[#1E293B] mb-1">
                      Bal: LKR {(rp.amountDue - rp.amountPaid).toLocaleString()}
                    </Text>
                    <View className="bg-slate-100 px-2 py-0.5 rounded-sm">
                      <Text className="font-poppins-semibold text-[8px] uppercase text-slate-500">
                        {rp.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="mt-8 mb-4 flex-row items-center justify-between">
          <Text className="font-poppins-bold text-lg text-[#1E293B]">Contracts</Text>
          <TouchableOpacity 
            className="bg-blue-50 px-3 py-1.5 rounded-full"
            onPress={() => router.push(`/contracts/new?unitId=${unit.id}` as Href)}
          >
            <Text className="text-blue-600 font-poppins-medium text-sm">+ Add</Text>
          </TouchableOpacity>
        </View>

        {contracts.length === 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center justify-center mb-8">
            <Text className="font-poppins-medium text-sm text-slate-500 mb-2">No contracts yet</Text>
            <PrimaryButton 
              title="Add Contract" 
              onPress={() => router.push(`/contracts/new?unitId=${unit.id}` as Href)} 
            />
          </View>
        ) : (
          <View className="mb-8">
            {contracts.map(c => {
              const isActive = c.status === 'active';
              return (
                <TouchableOpacity key={c.id} onPress={() => router.push(`/contracts/${c.id}` as Href)}>
                  <Card className={`mb-3 p-3.5 border-0 rounded-2xl shadow-sm flex-row items-center justify-between ${isActive ? 'bg-blue-50 border border-blue-100' : 'bg-surface'}`}>
                    <View className="flex-row items-center flex-1">
                      <View className={`w-11 h-11 rounded-full items-center justify-center mr-3 ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <Feather name="file-text" size={18} color={isActive ? '#3B82F6' : '#64748B'} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">
                          {c.tenant?.name || 'Unknown Tenant'}
                        </Text>
                        <Text className="text-slate-400 font-poppins-medium text-xs">
                          {new Date(c.startDate).toLocaleDateString()} – {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Ongoing'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <View className="items-end mr-3">
                        <Text className={`font-poppins-bold text-[13px] text-[#1E293B] mb-0.5`}>
                          LKR {c.monthlyRent.toLocaleString()}
                        </Text>
                        <View className={`${isActive ? 'bg-blue-200' : 'bg-slate-100'} px-1.5 rounded-sm`}>
                          <Text className={`font-poppins-semibold text-[8px] uppercase ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                            {isActive ? 'Current' : c.status}
                          </Text>
                        </View>
                      </View>
                      <Feather name="chevron-right" size={16} color="#CBD5E1" />
                    </View>
                  </Card>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
