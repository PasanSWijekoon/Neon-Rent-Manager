import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography } from '@/constants/theme';
import { AppLogo } from '@/components/ui/AppLogo';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className={`${typography.h2} text-text-primary`}>Neon Rent Manager</Text>
            <Text className={`${typography.bodyL} text-text-secondary mt-1`}>September 2026</Text>
          </View>
          <AppLogo size={48} />
        </View>

        {/* Summary Cards */}
        <View className="flex-row justify-between mb-4">
          <Card className="flex-1 mr-2 bg-surface border-0">
            <Text className={`${typography.caption} text-text-secondary uppercase mb-1`}>Expected</Text>
            <Text className={`${typography.h3} text-dark-navy`}>LKR 139,000</Text>
          </Card>
          <Card className="flex-1 ml-2 bg-surface border-0">
            <Text className={`${typography.caption} text-text-secondary uppercase mb-1`}>Collected</Text>
            <Text className={`${typography.h3} text-success`}>LKR 116,000</Text>
          </Card>
        </View>
        <Card className="mb-8 bg-surface border-0">
          <Text className={`${typography.caption} text-text-secondary uppercase mb-1`}>Outstanding</Text>
          <Text className={`${typography.h2} text-error`}>LKR 23,000</Text>
        </Card>

        {/* Status Summary */}
        <Text className={`${typography.h3} text-text-primary mb-4`}>Status Summary</Text>
        <View className="flex-row justify-between px-2 mb-8">
          <View className="items-center">
            <Text className={`${typography.h2} text-success`}>8</Text>
            <Text className={`${typography.bodyM} text-text-secondary mt-1`}>Paid</Text>
          </View>
          <View className="items-center">
            <Text className={`${typography.h2} text-warning`}>2</Text>
            <Text className={`${typography.bodyM} text-text-secondary mt-1`}>Due</Text>
          </View>
          <View className="items-center">
            <Text className={`${typography.h2} text-error`}>3</Text>
            <Text className={`${typography.bodyM} text-text-secondary mt-1`}>Overdue</Text>
          </View>
        </View>

        {/* Today's Due */}
        <Text className={`${typography.h3} text-text-primary mb-4`}>{"Today's Due"}</Text>
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Raj Kumar</Text>
              <Text className={`${typography.bodyM} text-text-secondary`}>Room A-01</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 8,000</Text>
              <StatusBadge status="due" label="Due today" />
            </View>
          </View>
        </Card>
        <Card className="mb-8">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Ravi Kumar</Text>
              <Text className={`${typography.bodyM} text-text-secondary`}>Shop 2</Text>
            </View>
            <View className="items-end">
              <Text className={`${typography.h4} text-text-primary mb-1`}>LKR 12,000</Text>
              <StatusBadge status="overdue" />
            </View>
          </View>
        </Card>

        {/* Recent Payments */}
        <Text className={`${typography.h3} text-text-primary mb-4`}>Recent Payments</Text>
        <Card className="mb-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`${typography.h4} text-text-primary`}>Raj Kumar</Text>
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
