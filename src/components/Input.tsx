import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
}

export function Input({ 
  label, 
  error, 
  leftIcon, 
  className = '', 
  onFocus,
  onBlur,
  ...props 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return 'border-error';
    if (isFocused) return 'border-primary';
    return 'border-border';
  };

  const getIconColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.textSecondary;
  };

  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="text-[13px] font-poppins-medium text-text-primary mb-1">
          {label}
        </Text>
      )}
      
      <View 
        className={`flex-row items-center h-12 px-3 border rounded-lg bg-white ${getBorderColor()}`}
      >
        {leftIcon && (
          <Feather 
            name={leftIcon} 
            size={20} 
            color={getIconColor()} 
            style={{ marginRight: 8 }} 
          />
        )}
        
        <TextInput
          className="flex-1 font-poppins-regular text-[14px] text-text-primary h-full"
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      
      {error && (
        <Text className="text-[11px] font-poppins-regular text-error mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
