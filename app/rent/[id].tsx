import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Href, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getRentPeriodById } from '@/lib/repositories/rentPeriods';
import { getPaymentsForRentPeriod } from '@/lib/repositories/payments';
import { getContract } from '@/lib/repositories/contracts';
import { getTenant } from '@/lib/repositories/tenants';
import { getUnitById } from '@/lib/repositories/units';
import { RentPeriod } from '@/types/rent';
import { Payment } from '@/types/payment';
import { Tenant } from '@/types/tenant';
import { Unit } from '@/types/unit';
import { Contract } from '@/types/contract';
import { generatePaymentReminder } from '@/lib/messageGenerator';

export default function RentPeriodDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<RentPeriod | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const rp = await getRentPeriodById(db, id);
      if (rp) {
        setPeriod(rp);
        const c = await getContract(db, rp.contractId);
        if (c) {
          setContract(c);
          const t = await getTenant(db, c.tenantId);
          setTenant(t);
          const u = await getUnitById(db, c.unitId);
          setUnit(u);
        }
        const p = await getPaymentsForRentPeriod(db, id);
        setPayments(p);
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

  if (!period) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Error</Text>
        </View>
        <Text className="text-center font-poppins-medium text-slate-500 mt-10">Rent period not found.</Text>
      </SafeAreaView>
    );
  }

  const balance = period.amountDue - period.amountPaid;
  let statusColor = 'text-slate-600';
  let statusBg = 'bg-slate-100';
  if (period.status === 'paid') {
    statusColor = 'text-emerald-700'; statusBg = 'bg-emerald-100';
  } else if (period.status === 'overdue') {
    statusColor = 'text-red-700'; statusBg = 'bg-red-100';
  } else if (period.status === 'partial') {
    statusColor = 'text-purple-700'; statusBg = 'bg-purple-100';
  } else if (period.status === 'due') {
    statusColor = 'text-amber-700'; statusBg = 'bg-amber-100';
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-200 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Rent Details</Text>
        </View>
        <TouchableOpacity 
          className="bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center"
          onPress={handleShare}
        >
          <Feather name="share-2" size={14} color="#2563EB" style={{ marginRight: 4 }} />
          <Text className="text-blue-600 font-poppins-medium text-sm">Send Reminder</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header Summary */}
        <View className="items-center mb-6">
          <Text className="font-poppins-semibold text-base text-slate-500 mb-1">
            {getMonthName(period.periodMonth)} {period.periodYear}
          </Text>
          <Text className="font-poppins-bold text-3xl text-[#1E293B] mb-2">LKR {balance.toLocaleString()}</Text>
          <Text className="font-poppins-medium text-sm text-slate-500 mb-3">Remaining Balance</Text>
          <View className={`${statusBg} px-3 py-1 rounded-full`}>
            <Text className={`font-poppins-semibold text-xs uppercase ${statusColor}`}>
              {period.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <Card className="bg-white border-0 rounded-3xl p-5 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <View>
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Unit</Text>
              <Text className="font-poppins-semibold text-sm text-[#1E293B]">{unit?.name || 'Unknown'}</Text>
            </View>
            <View className="items-end">
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Tenant</Text>
              <Text className="font-poppins-semibold text-sm text-[#1E293B]">{tenant?.name || 'Unknown'}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <View>
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Rent</Text>
              <Text className="font-poppins-semibold text-sm text-[#1E293B]">LKR {period.amountDue.toLocaleString()}</Text>
            </View>
            <View className="items-end">
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Paid</Text>
              <Text className="font-poppins-semibold text-sm text-[#1E293B]">LKR {period.amountPaid.toLocaleString()}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-poppins-regular text-xs text-slate-400 mb-0.5">Due Date</Text>
              <Text className="font-poppins-medium text-sm text-[#1E293B]">{new Date(period.dueDate).toLocaleDateString()}</Text>
            </View>
          </View>
        </Card>

        {balance > 0 && (
          <View className="mb-8">
            <PrimaryButton 
              title="Add Payment" 
              onPress={() => router.push(`/rent/${period.id}/add-payment` as Href)} 
            />
          </View>
        )}

        <Text className="font-poppins-bold text-lg text-[#1E293B] mb-3">Payment History</Text>
        
        {payments.length === 0 ? (
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center justify-center mb-8">
            <Text className="font-poppins-medium text-sm text-slate-500">No payments recorded</Text>
          </View>
        ) : (
          payments.map(p => (
            <Card key={p.id} className="mb-3 p-4 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3">
                  <Text className="font-poppins-bold text-[#10B981] text-xs">Rs.</Text>
                </View>
                <View>
                  <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-0.5">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </Text>
                  <Text className="font-poppins-medium text-xs text-slate-400 capitalize">
                    {p.method.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text className="font-poppins-bold text-sm text-[#1E293B]">
                LKR {p.amount.toLocaleString()}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
