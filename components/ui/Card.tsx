import React from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View 
      className={`bg-white rounded-xl border border-border shadow-sm p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
