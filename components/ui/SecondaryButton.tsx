import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/theme';

interface SecondaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export function SecondaryButton({ title, loading = false, className = '', ...props }: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      className={`h-12 bg-surface rounded-xl items-center justify-center flex-row px-4 ${
        props.disabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text className="font-poppins-semibold text-[16px] text-dark-navy">
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
