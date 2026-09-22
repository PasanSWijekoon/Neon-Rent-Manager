import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect, Href } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { getTenant, archiveTenant } from '@/lib/repositories/tenants';
import { getContractsForTenant } from '@/lib/repositories/contracts';
import { getUnitById } from '@/lib/repositories/units';
import { Tenant } from '@/types/tenant';
import { Contract } from '@/types/contract';
import { Unit } from '@/types/unit';
import { generatePaymentReminder } from '@/lib/messageGenerator';

export default function TenantDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [contracts, setContracts] = useState<(Contract & { unit: Unit | null })[]>([]);
  const [rentPeriods, setRentPeriods] = useState<any[]>([]);
  
  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const t = await getTenant(db, id);
      if (t) {
        setTenant(t);
        const cons = await getContractsForTenant(db, t.id);
        const consWithUnits = await Promise.all(
          cons.map(async (c) => {
            const u = await getUnitById(db, c.unitId);
            return { ...c, unit: u };
          })
        );
        setContracts(consWithUnits);

        const activeCons = cons.filter(c => c.status === 'active');
        if (activeCons.length > 0) {
          const { getRentPeriodsForContract } = require('@/lib/repositories/rentPeriods');
          let allPeriods: any[] = [];
          for (const ac of activeCons) {
            const periods = await getRentPeriodsForContract(db, ac.id);
            allPeriods = [...allPeriods, ...periods];
          }
          allPeriods.sort((a, b) => {
            if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear;
            return b.periodMonth - a.periodMonth;
          });
          setRentPeriods(allPeriods.slice(0, 3));
        }
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

  const handleShare = async () => {
    if (!tenant) return;
    try {
      const message = await generatePaymentReminder(db, tenant.id);
      if (!message) {
        Alert.alert('All Clear', 'There are no outstanding balances to send a reminder for.');
        return;
      }
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  };

  const handleArchive = async () => {
    const activeContract = contracts.find(c => c.status === 'active');
    if (activeContract) {
      Alert.alert(
        'Cannot Archive',
        'This tenant has an active contract. End the contract before archiving the tenant.'
      );
      return;
    }

    Alert.alert(
      'Archive Tenant',
      'Are you sure you want to archive this tenant? Historical records will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setArchiving(true);
            try {
              await archiveTenant(db, id);
              await loadData();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to archive tenant.');
            } finally {
              setArchiving(false);
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

  const isArchived = !!tenant.archivedAt;
  const activeContracts = contracts.filter(c => c.status === 'active');
  const historicalContracts = contracts.filter(c => c.status !== 'active');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-200 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Tenant Details</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity 
            className="bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center mr-2"
            onPress={handleShare}
          >
            <Feather name="share-2" size={14} color="#2563EB" style={{ marginRight: 4 }} />
            <Text className="text-blue-600 font-poppins-medium text-sm">Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-slate-100 px-3 py-1.5 rounded-full"
            onPress={() => router.push(`/tenants/edit?id=${tenant.id}` as Href)}
          >
            <Text className="text-slate-600 font-poppins-medium text-sm">Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Tenant Profile Card */}
        <View className="bg-white rounded-3xl p-5 mb-6 border border-slate-100 shadow-sm">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${isArchived ? 'bg-slate-100' : 'bg-emerald-100'}`}>
                <Feather name="user" size={24} color={isArchived ? '#64748B' : '#10B981'} />
              </View>
              <View className="flex-1">
                <Text className="font-poppins-bold text-xl text-[#1E293B] mb-0.5">{tenant.name}</Text>
                <View className={`self-start px-2 py-0.5 rounded-md ${isArchived ? 'bg-slate-100' : 'bg-emerald-100'}`}>
                  <Text className={`font-poppins-semibold text-[10px] uppercase ${isArchived ? 'text-slate-600' : 'text-emerald-700'}`}>
                    {isArchived ? 'Archived' : 'Active'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {tenant.phone && (
            <View className="flex-row items-center mb-3">
              <Feather name="phone" size={16} color="#64748B" className="mr-3" />
              <Text className="font-poppins-medium text-sm text-[#1E293B]">{tenant.phone}</Text>
            </View>
          )}

          {tenant.address && (
            <View className="flex-row items-start mb-3">
              <Feather name="map-pin" size={16} color="#64748B" className="mr-3 mt-0.5" />
              <Text className="font-poppins-regular text-sm text-[#1E293B] flex-1">{tenant.address}</Text>
            </View>
          )}

          {tenant.notes && (
            <View className="flex-row items-start mt-2 pt-3 border-t border-slate-100">
              <Feather name="file-text" size={16} color="#64748B" className="mr-3 mt-0.5" />
              <Text className="font-poppins-regular text-sm text-slate-500 flex-1">{tenant.notes}</Text>
            </View>
          )}
        </View>

        {/* Current Contracts */}
        <Text className="font-poppins-bold text-lg text-[#1E293B] mb-3">Active Contracts</Text>
        {activeContracts.length > 0 ? (
          <View className="mb-6">
            {activeContracts.map(contract => (
              <TouchableOpacity key={contract.id} onPress={() => router.push(`/contracts/${contract.id}` as Href)}>
                <Card className="mb-3 p-4 bg-surface border-0 rounded-2xl shadow-sm flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${contract.unit?.type === 'shop' ? 'bg-purple-100' : 'bg-blue-50'}`}>
                      <MaterialCommunityIcons name={contract.unit?.type === 'shop' ? 'briefcase-outline' : 'file-document-outline'} size={24} color={contract.unit?.type === 'shop' ? '#9333EA' : '#3B82F6'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-poppins-semibold text-base text-[#1E293B] mb-0.5">
                        {contract.unit?.name || 'Unknown Unit'}
                      </Text>
                      <Text className="font-poppins-medium text-xs text-slate-500 mb-1">
                        {new Date(contract.startDate).toLocaleDateString()} — {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing'}
                      </Text>
                      <Text className="font-poppins-bold text-sm text-[#1E293B]">
                        LKR {contract.monthlyRent.toLocaleString()} <Text className="font-poppins-medium text-xs text-slate-400">/ month</Text>
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color="#CBD5E1" />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center justify-center mb-6">
            <Text className="font-poppins-medium text-sm text-slate-500">No active contracts</Text>
          </View>
        )}

        {rentPeriods.length > 0 && (
          <View className="mb-6">
            <Text className="font-poppins-bold text-lg text-[#1E293B] mb-3">Recent Rent</Text>
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

        {/* Contract History */}
        <Text className="font-poppins-bold text-lg text-[#1E293B] mb-3">Contract History</Text>
        {historicalContracts.length === 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center justify-center mb-8">
            <Text className="font-poppins-medium text-sm text-slate-500">No historical contracts</Text>
          </View>
        ) : (
          historicalContracts.map((c, i) => (
            <TouchableOpacity key={c.id} onPress={() => router.push(`/contracts/${c.id}` as Href)}>
              <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="history" size={20} color="#64748B" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-0.5">
                      {c.unit?.name || 'Unknown Unit'}
                    </Text>
                    <Text className="font-poppins-medium text-xs text-slate-400">
                      {new Date(c.startDate).toLocaleDateString()} – {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Ongoing'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-poppins-bold text-xs text-[#1E293B] mb-1">
                    LKR {c.monthlyRent.toLocaleString()}
                  </Text>
                  <View className="bg-slate-100 px-2 py-0.5 rounded-sm">
                    <Text className="font-poppins-semibold text-[8px] uppercase text-slate-500">
                      {c.status}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Archive Button */}
        {!isArchived && (
          <TouchableOpacity 
            className={`mt-4 py-4 rounded-xl items-center flex-row justify-center ${archiving ? 'bg-slate-100' : 'bg-red-50'}`}
            onPress={handleArchive}
            disabled={archiving}
          >
            {archiving ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <>
                <Feather name="archive" size={16} color="#EF4444" className="mr-2" />
                <Text className="font-poppins-semibold text-sm text-red-500">Archive Tenant</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
