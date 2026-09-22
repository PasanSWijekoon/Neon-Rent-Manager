import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography, colors } from '@/constants/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { getRentPeriodsWithDetails, generateRentPeriodsForContract, RentPeriodWithDetails } from '@/lib/repositories/rentPeriods';
import { Contract } from '@/types/contract';

export default function Payments() {
  const router = useRouter();
  const db = useSQLiteContext();
  
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${now.getMonth() + 1}`;

  const [loading, setLoading] = useState(true);
  const [rentPeriods, setRentPeriods] = useState<RentPeriodWithDetails[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Auto-generate missing rent periods for active contracts
      const activeContracts = await db.getAllAsync<Contract>('SELECT * FROM contracts WHERE status = ?', ['active']);
      for (const contract of activeContracts) {
        await generateRentPeriodsForContract(db, contract);
      }

      const periods = await getRentPeriodsWithDetails(db);
      setRentPeriods(periods);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const uniqueMonths = Array.from(new Set([currentMonthStr, ...rentPeriods.map(p => `${p.periodYear}-${p.periodMonth}`)]))
    .sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

  const filteredPeriods = rentPeriods.filter(p => {
    const isMonthMatch = `${p.periodYear}-${p.periodMonth}` === selectedMonth;
    const isStatusMatch = statusFilter === 'all' || p.status === statusFilter;
    return isMonthMatch && isStatusMatch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 140 }}>
        
        <View className="flex-row justify-between items-start mb-8">
          <View>
            <Text className="text-slate-500 font-poppins-bold text-[10px] tracking-widest uppercase mb-0.5">Neon Rent Manager</Text>
            <Text className="text-[#1E293B] font-poppins-bold text-3xl leading-tight">Payments</Text>
            <Text className="text-slate-500 font-poppins-medium text-xs mt-0.5">Record and track</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setIsMonthModalVisible(true)}
            className="bg-white rounded-xl px-3 py-2 flex-row items-center border border-slate-200 mt-2 shadow-sm"
          >
            <Feather name="calendar" size={14} color="#1E293B" />
            <Text className="text-[#1E293B] font-poppins-medium text-xs ml-2 mr-1">
              {getMonthName(parseInt(selectedMonth.split('-')[1], 10))} {selectedMonth.split('-')[0]}
            </Text>
            <Feather name="chevron-down" size={14} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <Text className={`${typography.h3} text-[#1E293B] mb-3`}>Rent Periods</Text>
        
        {rentPeriods.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {['all', 'due', 'overdue', 'paid', 'partial', 'upcoming'].map(status => (
              <TouchableOpacity 
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full border mr-2 ${statusFilter === status ? 'bg-[#1E293B] border-[#1E293B]' : 'bg-white border-slate-200'}`}
              >
                <Text className={`font-poppins-medium text-xs capitalize ${statusFilter === status ? 'text-white' : 'text-slate-600'}`}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {filteredPeriods.length === 0 ? (
          <View className="bg-slate-50 rounded-2xl p-6 border border-slate-100 items-center justify-center mt-2">
            <Feather name="file-text" size={32} color="#94A3B8" className="mb-3" />
            <Text className="font-poppins-semibold text-base text-[#1E293B] mb-1">No rent periods</Text>
            <Text className="font-poppins-medium text-sm text-slate-500 text-center">
              No periods found for the selected filter.
            </Text>
          </View>
        ) : (
          filteredPeriods.map(period => {
            const balance = period.amountDue - period.amountPaid;
            const isShop = period.unit?.type === 'shop';
            
            let badgeBg = 'bg-slate-100';
            let badgeText = 'text-slate-500';
            let iconName = 'clock-outline';
            let iconColor = '#64748B';
            
            if (period.status === 'paid') {
              badgeBg = 'bg-[#E1FCEF]';
              badgeText = 'text-[#10B981]';
              iconName = 'check';
              iconColor = '#10B981';
            } else if (period.status === 'overdue') {
              badgeBg = 'bg-[#FFEBEE]';
              badgeText = 'text-[#EF4444]';
              iconName = 'exclamation-thick';
              iconColor = '#EF4444';
            } else if (period.status === 'partial') {
              badgeBg = 'bg-[#F3E8FF]';
              badgeText = 'text-[#9333EA]';
              iconName = 'contrast';
              iconColor = '#9333EA';
            } else {
              badgeBg = 'bg-[#FFF9E5]';
              badgeText = 'text-[#D97706]';
              iconName = 'clock-outline';
              iconColor = '#F59E0B';
            }

            return (
              <TouchableOpacity key={period.id} onPress={() => router.push(`/rent/${period.id}` as Href)}>
                <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-11 h-11 rounded-full items-center justify-center mr-3 ${isShop ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      <Text className={`font-poppins-semibold text-sm ${isShop ? 'text-purple-600' : 'text-blue-600'}`}>
                        {getInitials(period.tenant?.name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">
                        {period.tenant?.name || 'Unknown'}
                      </Text>
                      <Text className="text-slate-400 font-poppins-medium text-xs">
                        {period.unit?.name} • {getMonthName(period.periodMonth)} {period.periodYear}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    <View className="items-end mr-3">
                      <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-1.5">
                        LKR {balance > 0 ? balance.toLocaleString() : period.amountDue.toLocaleString()}
                      </Text>
                      <View className={`flex-row items-center px-2 py-1 rounded-full ${badgeBg}`}>
                        <View className="w-4 h-4 rounded-full items-center justify-center" style={{ backgroundColor: iconColor }}>
                          <MaterialCommunityIcons name={iconName as any} size={10} color="#FFFFFF" />
                        </View>
                        <Text className={`font-poppins-bold text-[8px] ml-1.5 mr-1 uppercase ${badgeText}`}>
                          {period.status}
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={16} color="#CBD5E1" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={isMonthModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white w-full rounded-3xl p-6">
            <Text className="font-poppins-bold text-lg text-[#1E293B] mb-4">Select Month</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {uniqueMonths.map(m => {
                const [y, mo] = m.split('-');
                const label = `${getMonthName(parseInt(mo, 10))} ${y}`;
                const isSelected = selectedMonth === m;
                return (
                  <TouchableOpacity 
                    key={m}
                    onPress={() => {
                      setSelectedMonth(m);
                      setIsMonthModalVisible(false);
                    }}
                    className={`flex-row justify-between items-center py-4 border-b border-slate-100 ${isSelected ? 'bg-blue-50/50 -mx-6 px-6' : ''}`}
                  >
                    <Text className={`font-poppins-medium text-base ${isSelected ? 'text-primary' : 'text-[#1E293B]'}`}>
                      {label}
                    </Text>
                    {isSelected && <Feather name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setIsMonthModalVisible(false)}
              className="mt-4 py-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="font-poppins-semibold text-slate-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
