import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  title: string;
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  title, 
  loading = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary border-primary';
      case 'secondary':
        return 'bg-primary/10 border-transparent';
      case 'outline':
        return 'bg-transparent border-primary border';
      case 'destructive':
        return 'bg-error border-error';
      default:
        return 'bg-primary border-primary';
    }
  };

  const getTextColorStyles = () => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return 'text-white';
      case 'secondary':
      case 'outline':
        return 'text-primary';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      className={`h-12 rounded-lg items-center justify-center flex-row px-4 ${getVariantStyles()} ${
        props.disabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? '#4D8BFF' : '#FFF'} />
      ) : (
        <Text className={`font-poppins-semibold text-[16px] ${getTextColorStyles()}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
