import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { getTenants } from '@/lib/repositories/tenants';
import { Tenant } from '@/types/tenant';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getContractsForTenant } from '@/lib/repositories/contracts';
import { getUnitById } from '@/lib/repositories/units';
import { Contract } from '@/types/contract';
import { Unit } from '@/types/unit';

export default function TenantsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantCurrentUnits, setTenantCurrentUnits] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getTenants(db);
      setTenants(data);
      
      const unitMap: Record<string, Unit> = {};
      
      // Determine current unit for each tenant (if active contract exists)
      for (const t of data) {
        if (t.archivedAt) continue;
        const contracts = await getContractsForTenant(db, t.id);
        const active = contracts.find(c => c.status === 'active');
        if (active) {
          const u = await getUnitById(db, active.unitId);
          if (u) {
            unitMap[t.id] = u;
          }
        }
      }
      setTenantCurrentUnits(unitMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-200 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Tenants</Text>
        </View>
        <TouchableOpacity 
          className="bg-blue-50 w-9 h-9 rounded-full items-center justify-center"
          onPress={() => router.push('/tenants/new' as Href)}
        >
          <Feather name="plus" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : tenants.length === 0 ? (
          <View className="items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
              <Feather name="users" size={24} color={colors.primary} />
            </View>
            <Text className="font-poppins-semibold text-lg text-[#1E293B] text-center mb-2">No tenants yet</Text>
            <Text className="font-poppins-regular text-sm text-slate-500 text-center mb-6">
              Add your first tenant to start creating rental contracts.
            </Text>
            <PrimaryButton 
              title="Add Tenant" 
              onPress={() => router.push('/tenants/new' as Href)} 
            />
          </View>
        ) : (
          tenants.map(tenant => {
            const isArchived = !!tenant.archivedAt;
            const currentUnit = tenantCurrentUnits[tenant.id];
            
            return (
              <TouchableOpacity key={tenant.id} onPress={() => router.push(`/tenants/${tenant.id}` as Href)}>
                <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-11 h-11 rounded-full items-center justify-center mr-3 ${isArchived ? 'bg-slate-100' : 'bg-emerald-100'}`}>
                      <Feather name="user" size={18} color={isArchived ? '#64748B' : '#10B981'} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">{tenant.name}</Text>
                      <Text className="text-slate-400 font-poppins-medium text-xs">
                        {tenant.phone || 'No phone'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="items-end mr-3">
                      <Text className={`font-poppins-bold text-[10px] ${isArchived ? 'text-slate-500' : 'text-emerald-500'} mb-1`}>
                        {isArchived ? 'ARCHIVED' : 'ACTIVE'}
                      </Text>
                      {currentUnit && !isArchived && (
                        <View className="flex-row items-center">
                          <Feather name={currentUnit.type === 'shop' ? 'briefcase' : 'home'} size={10} color="#94A3B8" />
                          <Text className="text-slate-400 font-poppins-medium text-[10px] ml-1">{currentUnit.name}</Text>
                        </View>
                      )}
                    </View>
                    <Feather name="chevron-right" size={16} color="#CBD5E1" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
