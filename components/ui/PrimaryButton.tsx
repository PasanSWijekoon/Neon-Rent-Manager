import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export function PrimaryButton({ title, loading = false, className = '', ...props }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      className={`h-12 bg-primary rounded-xl items-center justify-center flex-row px-4 ${
        props.disabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text className="font-poppins-semibold text-[16px] text-white">
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
