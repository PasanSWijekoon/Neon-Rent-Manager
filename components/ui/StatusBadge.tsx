import React from 'react';
import { View, Text } from 'react-native';

export type BadgeStatus = 'paid' | 'due' | 'overdue' | 'upcoming' | 'partial';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'paid':
        return { bg: 'bg-[#E1FCEF]', text: 'text-success' }; 
      case 'due':
        return { bg: 'bg-[#FFF9E5]', text: 'text-warning' }; 
      case 'overdue':
        return { bg: 'bg-[#FFEBEE]', text: 'text-error' }; 
      case 'upcoming':
        return { bg: 'bg-[#E3F2FD]', text: 'text-primary' }; 
      case 'partial':
        return { bg: 'bg-[#F3E8FF]', text: 'text-purple' }; 
      default:
        return { bg: 'bg-surface', text: 'text-text-secondary' };
    }
  };

  const { bg, text } = getStyles();
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View className={`px-3 py-1 rounded-full self-start ${bg}`}>
      <Text className={`font-poppins-medium text-[11px] uppercase tracking-wider ${text}`}>
        {displayLabel}
      </Text>
    </View>
  );
}
