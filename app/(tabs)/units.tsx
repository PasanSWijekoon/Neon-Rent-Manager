import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography, colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Feather } from '@expo/vector-icons';

export default function Units() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View className="flex-row justify-between items-start mb-8">
          <View>
            <Text className="text-slate-500 font-poppins-bold text-[10px] tracking-widest uppercase mb-0.5">Neon Rent Manager</Text>
            <Text className="text-[#1E293B] font-poppins-bold text-3xl leading-tight">Properties</Text>
            <Text className="text-slate-500 font-poppins-medium text-xs mt-0.5">Manage your units</Text>
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
              <Text className="text-white font-poppins-semibold text-sm ml-1.5">Add Unit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className={`${typography.h3} text-[#1E293B] mb-4 mt-2`}>Hostel Rooms</Text>
        
        <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Feather name="home" size={18} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">Room A-01</Text>
              <Text className="text-slate-400 font-poppins-medium text-xs">Raj Kumar</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="items-end mr-3">
              <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-0.5">LKR 8,000</Text>
              <Text className="text-blue-500 font-poppins-bold text-[10px]">Occupied</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </View>
        </Card>

        <Card className="mb-8 p-3.5 bg-surface border border-dashed border-slate-300 rounded-2xl shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center mr-3">
              <Feather name="home" size={18} color="#94A3B8" />
            </View>
            <View className="flex-1">
              <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">Room A-02</Text>
              <Text className="text-slate-400 font-poppins-medium text-xs">Available</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="items-end mr-3">
              <Text className="text-slate-400 font-poppins-semibold text-[13px] mb-0.5">--</Text>
              <Text className="text-emerald-500 font-poppins-bold text-[10px]">Vacant</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </View>
        </Card>

        <Text className={`${typography.h3} text-[#1E293B] mb-4`}>Shops</Text>
        
        <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-11 h-11 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Feather name="briefcase" size={18} color="#9333EA" />
            </View>
            <View className="flex-1">
              <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">Shop 1</Text>
              <Text className="text-slate-400 font-poppins-medium text-xs">Ahmed Khan</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="items-end mr-3">
              <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-0.5">LKR 15,000</Text>
              <Text className="text-blue-500 font-poppins-bold text-[10px]">Occupied</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#CBD5E1" />
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

