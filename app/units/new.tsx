import React, { useState, useEffect } from 'react';
import {  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator , Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/constants/theme';
import { createUnit } from '@/lib/repositories/units';
import { getProperties } from '@/lib/repositories/properties';
import { Property } from '@/types/property';
import { UnitType } from '@/types/unit';

export default function NewUnitScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: UnitType }>();
  const db = useSQLiteContext();

  const [name, setName] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [loadingProps, setLoadingProps] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const props = await getProperties(db);
        setProperties(props);
        if (props.length === 1) {
          setSelectedPropertyId(props[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProps(false);
      }
    }
    fetchProperties();
  }, [db]);

  const handleSave = async () => {
    if (!selectedPropertyId) {
      Alert.alert('Validation Error', 'Please select a property.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please provide a unit name.');
      return;
    }

    const selectedProp = properties.find(p => p.id === selectedPropertyId);

    Alert.alert(
      "Confirm Unit",
      `Are you sure you want to add "${trimmedName}" to ${selectedProp?.name || 'this property'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add Unit", 
          onPress: async () => {
            setSaving(true);
            try {
              const now = new Date().toISOString();
              await createUnit(db, {
                id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
                propertyId: selectedPropertyId,
                type: type || 'hostel_room',
                name: trimmedName,
                status: 'vacant',
                currentContractId: null,
                createdAt: now,
                updatedAt: now,
              });
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to create unit.');
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const title = type === 'shop' ? 'Add Shop' : 'Add Hostel Room';
  const icon = type === 'shop' ? 'briefcase' : 'home';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-[#1E293B]">{title}</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <View className="mb-6">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Unit Name</Text>
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14">
            <Feather name={icon} size={20} color="#94A3B8" className="mr-3" />
            <TextInput style={{ textAlignVertical: 'center', marginTop: Platform.OS === 'android' ? 4 : 0 }}
              className="flex-1 font-poppins-regular text-[#1E293B] py-0"
              placeholder={type === 'shop' ? "e.g. Shop 1" : "e.g. Room 101"}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-poppins-medium text-sm text-[#1E293B] mb-2">Select Property</Text>
          {loadingProps ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
          ) : properties.length === 0 ? (
            <View className="p-4 bg-orange-50 rounded-xl border border-orange-100 items-start">
              <Text className="font-poppins-medium text-orange-800 text-sm mb-3">No properties found. Please add a property first.</Text>
              <PrimaryButton 
                title="Create Property" 
                onPress={() => router.push('/properties/new' as any)} 
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          ) : (
            <View className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {properties.map((prop, index) => {
                const isSelected = selectedPropertyId === prop.id;
                return (
                  <TouchableOpacity
                    key={prop.id}
                    onPress={() => setSelectedPropertyId(prop.id)}
                    className={`flex-row items-center p-4 ${index !== properties.length - 1 ? 'border-b border-slate-100' : ''} ${isSelected ? 'bg-blue-50/50' : ''}`}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: isSelected ? colors.primary : '#CBD5E1', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                    </View>
                    <Text className={`font-poppins-medium text-sm ${isSelected ? 'text-primary' : 'text-[#1E293B]'}`}>{prop.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <PrimaryButton 
          title={`Save ${type === 'shop' ? 'Shop' : 'Room'}`} 
          onPress={handleSave} 
          loading={saving} 
          disabled={properties.length === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
