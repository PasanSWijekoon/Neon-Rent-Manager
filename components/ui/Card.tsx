import React from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  // Use array syntax for cleaner class merging in NativeWind v5 if possible,
  // or just rely on the caller overriding specific properties via style if needed.
  return (
    <View 
      className={`bg-surface rounded-2xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
