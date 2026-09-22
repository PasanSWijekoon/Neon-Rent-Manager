import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Href, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { getContract, updateContract, checkUnitOccupiedToday } from '@/lib/repositories/contracts';
import { getTenant } from '@/lib/repositories/tenants';
import { getUnitById, updateUnit } from '@/lib/repositories/units';
import { Contract } from '@/types/contract';
import { Tenant } from '@/types/tenant';
import { Unit } from '@/types/unit';

export default function ContractDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const c = await getContract(db, id);
      if (c) {
        setContract(c);
        const t = await getTenant(db, c.tenantId);
        setTenant(t);
        const u = await getUnitById(db, c.unitId);
        setUnit(u);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleEndContract = () => {
    Alert.alert(
      'End Contract',
      'Are you sure you want to end this contract? This will preserve the historical record but mark it as ended.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Contract', 
          style: 'destructive',
          onPress: async () => {
            if (!id || !contract) return;
            setEnding(true);
            try {
              const now = new Date().toISOString();
              const today = now.split('T')[0];
              
              let newEndDate = contract.endDate;
              // If there's no end date, or the existing end date is in the future, truncate it to today
              if (!newEndDate || newEndDate > today) {
                newEndDate = today;
              }

              await updateContract(db, id, {
                status: 'expired',
                endDate: newEndDate,
                updatedAt: now,
              });
              
              const isStillOccupied = await checkUnitOccupiedToday(db, contract.unitId);
              await updateUnit(db, contract.unitId, { 
                status: isStillOccupied ? 'occupied' : 'vacant', 
                updatedAt: now 
              });
              
              await loadData();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to end contract.');
            } finally {
              setEnding(false);
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

  if (!contract) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Error</Text>
        </View>
        <Text className="text-center font-poppins-medium text-slate-500 mt-10">Contract not found.</Text>
      </SafeAreaView>
    );
  }

  const isActive = contract.status === 'active';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-200 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Contract Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header Summary */}
        <View className="items-center mb-8">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
            <MaterialCommunityIcons name="file-document-outline" size={32} color={isActive ? '#3B82F6' : '#64748B'} />
          </View>
          <Text className="font-poppins-bold text-2xl text-[#1E293B]">LKR {contract.monthlyRent.toLocaleString()}</Text>
          <Text className="font-poppins-medium text-sm text-slate-500 mb-2">Monthly Rent</Text>
          <View className={`${isActive ? 'bg-blue-100' : 'bg-slate-200'} px-3 py-1 rounded-full`}>
            <Text className={`font-poppins-semibold text-xs uppercase ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
              {contract.status}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <Card className="bg-white border-0 rounded-3xl p-5 mb-6 shadow-sm">
          
          <TouchableOpacity 
            className="flex-row items-center mb-5 pb-5 border-b border-slate-100"
            onPress={() => router.push(`/units/${unit?.id}` as Href)}
          >
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${unit?.type === 'shop' ? 'bg-purple-100' : 'bg-blue-100'}`}>
              <Feather name={unit?.type === 'shop' ? 'briefcase' : 'home'} size={18} color={unit?.type === 'shop' ? '#9333EA' : '#3B82F6'} />
            </View>
            <View className="flex-1">
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Unit</Text>
              <Text className="font-poppins-semibold text-base text-[#1E293B]">{unit?.name || 'Unknown'}</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center mb-5 pb-5 border-b border-slate-100"
            onPress={() => router.push(`/tenants/${tenant?.id}` as Href)}
          >
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
              <Feather name="user" size={18} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Tenant</Text>
              <Text className="font-poppins-semibold text-base text-[#1E293B]">{tenant?.name || 'Unknown'}</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View className="flex-row mb-5 pb-5 border-b border-slate-100">
            <View className="flex-1">
              <Text className="font-poppins-regular text-xs text-slate-400 mb-1">Start Date</Text>
              <Text className="font-poppins-medium text-[#1E293B]">{new Date(contract.startDate).toLocaleDateString()}</Text>
            </View>
            <View className="flex-1 pl-4 border-l border-slate-100">
              <Text className="font-poppins-regular text-xs text-slate-400 mb-1">End Date</Text>
              <Text className="font-poppins-medium text-[#1E293B]">
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing'}
              </Text>
            </View>
          </View>

          {contract.notes && (
            <View>
              <Text className="font-poppins-regular text-xs text-slate-400 mb-1">Notes</Text>
              <Text className="font-poppins-regular text-sm text-[#1E293B] leading-relaxed">{contract.notes}</Text>
            </View>
          )}

        </Card>

        {isActive && (
          <TouchableOpacity 
            className={`mt-2 py-4 rounded-xl items-center flex-row justify-center ${ending ? 'bg-slate-100' : 'bg-red-50'}`}
            onPress={handleEndContract}
            disabled={ending}
          >
            {ending ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <>
                <Feather name="x-circle" size={16} color="#EF4444" className="mr-2" />
                <Text className="font-poppins-semibold text-sm text-red-500">End Contract</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
}
