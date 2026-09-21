import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/theme';

type StatusType = 'paid' | 'due' | 'overdue' | 'upcoming' | 'partial';

interface StatusChipProps {
  status: StatusType;
}

export function StatusChip({ status }: StatusChipProps) {
  const getStyles = () => {
    switch (status) {
      case 'paid':
        return {
          bgClass: 'bg-success/10',
          textClass: 'text-success',
          icon: 'check-circle',
          color: colors.success,
          label: 'Paid'
        };
      case 'due':
        return {
          bgClass: 'bg-warning/10',
          textClass: 'text-warning',
          icon: 'clock',
          color: colors.warning,
          label: 'Due'
        };
      case 'overdue':
        return {
          bgClass: 'bg-error/10',
          textClass: 'text-error',
          icon: 'alert-circle',
          color: colors.error,
          label: 'Overdue'
        };
      case 'upcoming':
        return {
          bgClass: 'bg-info/10',
          textClass: 'text-info',
          icon: 'calendar',
          color: colors.info,
          label: 'Upcoming'
        };
      case 'partial':
        return {
          bgClass: 'bg-purple/10',
          textClass: 'text-purple',
          icon: 'pie-chart',
          color: colors.purple,
          label: 'Partial'
        };
      default:
        return {
          bgClass: 'bg-surface',
          textClass: 'text-text-secondary',
          icon: 'circle',
          color: colors.textSecondary,
          label: 'Unknown'
        };
    }
  };

  const config = getStyles();

  return (
    <View className={`flex-row items-center px-2 py-1 rounded-full self-start ${config.bgClass}`}>
      <Feather name={config.icon as any} size={12} color={config.color} style={{ marginRight: 4 }} />
      <Text className={`font-poppins-medium text-[11px] ${config.textClass}`}>
        {config.label}
      </Text>
    </View>
  );
}
