import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { typography } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function History() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="mb-8">
          <Text className={`${typography.h2} text-text-primary`}>History</Text>
          <Text className={`${typography.bodyM} text-text-secondary mt-1`}>All past transactions</Text>
        </View>

        <Text className={`${typography.h4} text-text-secondary mb-4`}>August 2026</Text>
        
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Raj Kumar</Text>
              <Text className={`${typography.bodyS} text-text-secondary mt-1`}>Room A-01 • Aug 01, 2026</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 8,000</Text>
              <StatusBadge status="paid" />
            </View>
          </View>
        </Card>
        
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Ahmed Khan</Text>
              <Text className={`${typography.bodyS} text-text-secondary mt-1`}>Shop 1 • Aug 05, 2026</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 15,000</Text>
              <StatusBadge status="paid" />
            </View>
          </View>
        </Card>

        <Card className="mb-8">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Ravi Kumar</Text>
              <Text className={`${typography.bodyS} text-text-secondary mt-1`}>Shop 2 • Aug 10, 2026</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 12,000</Text>
              <StatusBadge status="paid" />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
