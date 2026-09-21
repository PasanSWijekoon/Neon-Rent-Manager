import React from 'react';
import { Image, ImageStyle } from 'expo-image';
import { images } from '@/constants/images';

interface AppLogoProps {
  size?: number;
  style?: ImageStyle;
}

export function AppLogo({ size = 48, style }: AppLogoProps) {
  return (
    <Image
      source={images.logo}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
    />
  );
}
