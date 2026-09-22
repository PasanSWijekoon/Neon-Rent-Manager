import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { getRentPeriodById } from '@/lib/repositories/rentPeriods';
import { createPayment } from '@/lib/repositories/payments';
import { RentPeriod } from '@/types/rent';
import { Payment, PaymentMethod } from '@/types/payment';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddPaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<RentPeriod | null>(null);
  
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const rp = await getRentPeriodById(db, id);
        if (rp) {
          setPeriod(rp);
          // Suggest full remaining balance
          const balance = rp.amountDue - rp.amountPaid;
          setAmountStr(balance.toString());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, db]);

  const handleSave = async () => {
    if (!id || !period) return;
    
    const amount = parseInt(amountStr, 10);
    const balance = period.amountDue - period.amountPaid;
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0.');
      return;
    }
    
    if (amount > balance) {
      Alert.alert('Validation Error', 'Payment exceeds the remaining balance.');
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Record payment of LKR ${amount.toLocaleString()} via ${method}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Record Payment", 
          onPress: async () => {
            setSaving(true);
            try {
              const now = new Date().toISOString();
              const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
              
              const newPayment: Partial<Payment> = {
                id: newId,
                rentPeriodId: period.id,
                contractId: period.contractId,
              };
              
              const { getContract } = require('@/lib/repositories/contracts');
              const contract = await getContract(db, period.contractId);
              if (!contract) throw new Error('Contract not found');
              
              newPayment.tenantId = contract.tenantId;
              newPayment.amount = amount;
              newPayment.paymentDate = paymentDate.toISOString().split('T')[0];
              newPayment.method = method;
              newPayment.notes = notes.trim() || null;
              newPayment.createdAt = now;
              
              await createPayment(db, newPayment as Payment);
              
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to record payment.');
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

  if (!period) return null;
  const balance = period.amountDue - period.amountPaid;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Add Payment</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        
        <View className="mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <Text className="font-poppins-medium text-sm text-blue-800 mb-1">Remaining Balance</Text>
          <Text className="font-poppins-bold text-2xl text-blue-900">LKR {balance.toLocaleString()}</Text>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Amount (LKR) *</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name="dollar-sign" size={20} color="#94A3B8" className="mr-3" />
            <TextInput
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Payment Date *</Text>
          <TouchableOpacity 
            className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14"
            onPress={() => setShowDatePicker(true)}
          >
            <Feather name="calendar" size={20} color="#94A3B8" className="mr-3" />
            <Text className="font-poppins-regular text-[#1E293B]">
              {paymentDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={paymentDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setPaymentDate(selectedDate);
            }}
          />
        )}

        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Payment Method *</Text>
          <View className="flex-row flex-wrap gap-2">
            {(['cash', 'bank_transfer', 'other'] as PaymentMethod[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                className={`px-4 py-2 rounded-full border ${method === m ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}
              >
                <Text className={`font-poppins-medium text-sm capitalize ${method === m ? 'text-blue-700' : 'text-slate-600'}`}>
                  {m.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Notes</Text>
          <View className="bg-white border border-slate-200 rounded-xl px-4 py-3 min-h-[100px]">
            <TextInput
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder="Optional notes"
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        <PrimaryButton 
          title="Record Payment" 
          onPress={handleSave} 
          loading={saving} 
        />
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
