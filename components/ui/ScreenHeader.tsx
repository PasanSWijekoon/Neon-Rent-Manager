import React from 'react';
import { View, Text } from 'react-native';
import { typography } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View>
        <Text className={typography.h2}>{title}</Text>
        {subtitle && (
          <Text className={`${typography.bodyM} text-text-secondary mt-1`}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
