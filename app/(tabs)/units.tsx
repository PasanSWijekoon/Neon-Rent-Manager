import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '@/components/ui/Card';
import { typography, colors } from '@/constants/theme';
import { getUnits } from '@/lib/repositories/units';
import { getProperties } from '@/lib/repositories/properties';
import { Unit } from '@/types/unit';
import { Property } from '@/types/property';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function UnitsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [unitsData, propsData] = await Promise.all([
        getUnits(db),
        getProperties(db)
      ]);
      
      const propsMap: Record<string, Property> = {};
      propsData.forEach(p => propsMap[p.id] = p);
      
      setProperties(propsMap);
      setUnits(unitsData);
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

  const hostelRooms = units.filter(u => u.type === 'hostel_room');
  const shops = units.filter(u => u.type === 'shop');

  const handleAddUnit = (type: 'hostel_room' | 'shop') => {
    setSheetVisible(false);
    router.push(`/units/new?type=${type}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 140 }}>
        
        <View className="mb-6">
          <Text className="text-slate-500 font-poppins-bold text-[10px] tracking-widest uppercase mb-0.5">Neon Rent Manager</Text>
          <Text className="text-[#1E293B] font-poppins-bold text-3xl leading-tight">Units</Text>
          <Text className="text-slate-500 font-poppins-medium text-xs mt-0.5">Manage your rooms and shops</Text>
          
          <View className="flex-row items-center mt-5 flex-wrap gap-y-3">
            <TouchableOpacity 
              className="h-10 px-4 bg-primary rounded-full flex-row items-center justify-center mr-2"
              style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              onPress={() => setSheetVisible(true)}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text className="text-white font-poppins-semibold text-sm ml-1.5">Add Unit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="h-10 px-4 bg-[#EFF6FF] rounded-full flex-row items-center justify-center mr-2"
              onPress={() => router.push('/tenants' as Href)}
            >
              <Feather name="users" size={14} color="#3B82F6" />
              <Text className="text-[#3B82F6] font-poppins-semibold text-sm ml-1.5">Tenants</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="h-10 px-4 bg-[#EFF6FF] rounded-full flex-row items-center justify-center"
              onPress={() => router.push('/properties' as Href)}
            >
              <Feather name="home" size={14} color="#3B82F6" />
              <Text className="text-[#3B82F6] font-poppins-semibold text-sm ml-1.5">Properties</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : units.length === 0 ? (
          <View className="items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
              <Feather name="grid" size={24} color={colors.primary} />
            </View>
            <Text className="font-poppins-semibold text-lg text-[#1E293B] text-center mb-2">No units yet</Text>
            <Text className="font-poppins-regular text-sm text-slate-500 text-center mb-6">
              {Object.keys(properties).length === 0 
                ? "You need to create a property before adding units." 
                : "Add your first room or shop to get started."}
            </Text>
            {Object.keys(properties).length === 0 ? (
              <PrimaryButton 
                title="Create Property" 
                onPress={() => router.push('/properties/new' as any)} 
              />
            ) : (
              <PrimaryButton 
                title="Add Unit" 
                onPress={() => setSheetVisible(true)} 
              />
            )}
          </View>
        ) : (
          <>
            {hostelRooms.length > 0 && (
              <>
                <Text className={`${typography.h3} text-[#1E293B] mb-4 mt-2`}>Hostel Rooms</Text>
                {hostelRooms.map(unit => (
                  <TouchableOpacity key={unit.id} onPress={() => router.push(`/units/${unit.id}` as Href)}>
                    <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Feather name="home" size={18} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">{unit.name}</Text>
                          <Text className="text-slate-400 font-poppins-medium text-xs">
                            {properties[unit.propertyId]?.name || 'Unknown Property'}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="items-end mr-3">
                          <Text className={`font-poppins-bold text-[10px] ${unit.status === 'vacant' ? 'text-emerald-500' : 'text-blue-500'}`}>
                            {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={16} color="#CBD5E1" />
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {shops.length > 0 && (
              <>
                <Text className={`${typography.h3} text-[#1E293B] mb-4 mt-4`}>Shops</Text>
                {shops.map(unit => (
                  <TouchableOpacity key={unit.id} onPress={() => router.push(`/units/${unit.id}` as Href)}>
                    <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-11 h-11 rounded-full bg-purple-100 items-center justify-center mr-3">
                          <Feather name="briefcase" size={18} color="#9333EA" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">{unit.name}</Text>
                          <Text className="text-slate-400 font-poppins-medium text-xs">
                            {properties[unit.propertyId]?.name || 'Unknown Property'}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="items-end mr-3">
                          <Text className={`font-poppins-bold text-[10px] ${unit.status === 'vacant' ? 'text-emerald-500' : 'text-blue-500'}`}>
                            {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={16} color="#CBD5E1" />
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Unit Bottom Sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setSheetVisible(false)} />
          
          <View className="bg-white rounded-t-3xl p-6 pb-12 shadow-lg">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="font-poppins-bold text-xl text-[#1E293B]">Add New Unit</Text>
                <Text className="font-poppins-medium text-sm text-slate-500 mt-1">Choose the type of unit you want to add</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSheetVisible(false)}
                className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className="mb-4 flex-row items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"
              onPress={() => handleAddUnit('hostel_room')}
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                <Feather name="home" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="font-poppins-semibold text-base text-[#1E293B]">Hostel Room</Text>
                <Text className="font-poppins-regular text-xs text-slate-500">Add a new room</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"
              onPress={() => handleAddUnit('shop')}
            >
              <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-4">
                <Feather name="briefcase" size={20} color="#9333EA" />
              </View>
              <View className="flex-1">
                <Text className="font-poppins-semibold text-base text-[#1E293B]">Shop</Text>
                <Text className="font-poppins-regular text-xs text-slate-500">Add a new shop</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
