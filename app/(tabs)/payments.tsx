import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography, colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Payments() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 140 }}>
        
        <View className="flex-row justify-between items-start mb-8">
          <View>
            <Text className="text-slate-500 font-poppins-bold text-[10px] tracking-widest uppercase mb-0.5">Neon Rent Manager</Text>
            <Text className="text-[#1E293B] font-poppins-bold text-3xl leading-tight">Payments</Text>
            <Text className="text-slate-500 font-poppins-medium text-xs mt-0.5">Record and track</Text>
          </View>
          
          <View className="flex-row items-center mt-2.5">
            <TouchableOpacity className="w-10 h-10 rounded-full bg-[#EFF6FF] items-center justify-center mr-2">
              <Feather name="search" size={16} color="#334155" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="h-10 px-4 bg-primary rounded-full flex-row items-center justify-center"
              style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text className="text-white font-poppins-semibold text-sm ml-1.5">Record</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className={`${typography.h3} text-[#1E293B] mb-4`}>Due This Month</Text>
        
        <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Text className="text-blue-500 font-poppins-semibold text-sm">RK</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">Raj Kumar</Text>
              <Text className="text-slate-400 font-poppins-medium text-xs">Room A-01 • Sep 2026</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="items-end mr-3">
              <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-1.5">LKR 8,000</Text>
              <View className="flex-row items-center px-2 py-1 rounded-full bg-[#FEF3C7]">
                <View className="w-4 h-4 rounded-full items-center justify-center bg-[#F59E0B]">
                  <Feather name="clock" size={10} color="#FFFFFF" />
                </View>
                <Text className="font-poppins-bold text-[8px] ml-1.5 mr-1 uppercase text-[#D97706]">DUE TODAY</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}



