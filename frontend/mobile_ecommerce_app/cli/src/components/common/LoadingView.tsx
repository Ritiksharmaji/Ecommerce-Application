import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {colors} from '@/theme';

/** Full-screen spinner. */
export default function LoadingView({className = 'bg-background'}: {className?: string}) {
  return (
    <View className={`flex-1 items-center justify-center ${className}`}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
