import React from 'react';
import {ActivityIndicator, TouchableOpacity} from 'react-native';
import {Text} from '@/components/ui/Typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Pill shape (auth screens) instead of rounded rectangle. */
  rounded?: boolean;
  className?: string;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  rounded = false,
  className = '',
}: PrimaryButtonProps) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{disabled: inactive, busy: loading}}
      className={`items-center py-4 ${rounded ? 'rounded-full' : 'rounded-xl'} ${
        inactive ? 'bg-gray-300' : 'bg-primary'
      } ${className}`}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-lg font-bold text-white">{title}</Text>
      )}
    </TouchableOpacity>
  );
}
