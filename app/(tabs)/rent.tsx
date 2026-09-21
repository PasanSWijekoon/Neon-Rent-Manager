import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function Rent() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className={`${typography.h2} text-text-primary`}>Rent</Text>
            <Text className={`${typography.bodyM} text-text-secondary mt-1`}>September 2026</Text>
          </View>
          <PrimaryButton title="Record" className="h-10 px-4" />
        </View>

        <Text className={`${typography.h3} text-error mb-4`}>Overdue</Text>
        <Card className="mb-3 border-error/20">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Shop 2</Text>
              <Text className={`${typography.bodyS} text-text-secondary`}>Ravi Kumar</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 12,000</Text>
              <StatusBadge status="overdue" />
            </View>
          </View>
        </Card>

        <Text className={`${typography.h3} text-warning mb-4 mt-6`}>Due</Text>
        <Card className="mb-3 border-warning/20">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Room A-01</Text>
              <Text className={`${typography.bodyS} text-text-secondary`}>Raj Kumar</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 8,000</Text>
              <StatusBadge status="due" label="Due Today" />
            </View>
          </View>
        </Card>

        <Text className={`${typography.h3} text-success mb-4 mt-6`}>Paid</Text>
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Shop 1</Text>
              <Text className={`${typography.bodyS} text-text-secondary`}>Ahmed Khan</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 15,000</Text>
              <StatusBadge status="paid" />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
