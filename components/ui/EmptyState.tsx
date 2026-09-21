import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography, colors } from '@/constants/theme';
import { SecondaryButton } from './SecondaryButton';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-10 px-4">
      <View className="bg-surface w-16 h-16 rounded-full items-center justify-center mb-4">
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <Text className={`${typography.h3} mb-2 text-center`}>{title}</Text>
      <Text className={`${typography.bodyM} text-text-secondary text-center mb-6`}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <SecondaryButton title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}
