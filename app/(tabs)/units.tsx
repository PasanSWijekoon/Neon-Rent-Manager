import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function Units() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className={`${typography.h2} text-text-primary`}>Units</Text>
            <Text className={`${typography.bodyM} text-text-secondary mt-1`}>Manage your properties</Text>
          </View>
          <PrimaryButton title="Add Unit" className="h-10 px-4" />
        </View>

        <Text className={`${typography.h3} text-text-primary mb-4 mt-2`}>Hostel Rooms</Text>
        
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary mb-1`}>Room A-01</Text>
              <Text className={`${typography.bodyM} text-text-primary`}>Raj Kumar</Text>
              <Text className={`${typography.bodyS} text-text-secondary`}>LKR 8,000 / month</Text>
            </View>
            <View className="items-end">
              <StatusBadge status="upcoming" label="Occupied" />
            </View>
          </View>
        </Card>

        <Card className="mb-8 bg-surface border-dashed">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary mb-1`}>Room A-02</Text>
              <Text className={`${typography.bodyS} text-text-secondary`}>Available</Text>
            </View>
            <View className="items-end">
              {/* @ts-ignore */}
              <StatusBadge status="default" label="Vacant" /> 
            </View>
          </View>
        </Card>

        <Text className={`${typography.h3} text-text-primary mb-4`}>Shops</Text>
        
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary mb-1`}>Shop 1</Text>
              <Text className={`${typography.bodyM} text-text-primary`}>Ahmed Khan</Text>
              <Text className={`${typography.bodyS} text-text-secondary`}>LKR 15,000 / month</Text>
            </View>
            <View className="items-end">
              <StatusBadge status="upcoming" label="Occupied" />
            </View>
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
