import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { typography, colors } from '@/constants/theme';
import { Property } from '@/types/property';
import { getProperties } from '@/lib/repositories/properties';

export default function PropertiesListScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    try {
      const data = await getProperties(db);
      setProperties(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">Manage Properties</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`${typography.h3} text-[#1E293B]`}>Your Properties</Text>
          <TouchableOpacity 
            className="h-9 px-4 bg-primary rounded-full flex-row items-center justify-center"
            onPress={() => router.push('/properties/new' as any)}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text className="text-white font-poppins-semibold text-xs ml-1.5">Add Property</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : properties.length === 0 ? (
          <View className="items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
              <Feather name="home" size={24} color={colors.primary} />
            </View>
            <Text className="font-poppins-semibold text-lg text-[#1E293B] text-center mb-2">No property yet</Text>
            <Text className="font-poppins-regular text-sm text-slate-500 text-center mb-6">
              Add your property to start managing rooms and shops.
            </Text>
            <PrimaryButton 
              title="Add Property" 
              onPress={() => router.push('/properties/new' as any)} 
            />
          </View>
        ) : (
          properties.map(property => (
            <TouchableOpacity 
              key={property.id}
              onPress={() => router.push(`/properties/${property.id}` as any)}
            >
              <Card className="mb-3 p-4 bg-white border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Text className="text-blue-600 font-poppins-semibold text-lg">
                      {property.name.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#1E293B] font-poppins-semibold text-base mb-0.5">{property.name}</Text>
                    <Text className="text-slate-500 font-poppins-medium text-xs">{property.address}</Text>
                  </View>
                </View>
                <Feather name="edit-2" size={18} color="#94A3B8" />
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
