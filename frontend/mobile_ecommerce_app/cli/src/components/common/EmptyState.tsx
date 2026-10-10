import React from 'react';
import {View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons, type IconName} from '@/components/icons';
import {colors} from '@/theme';
import PrimaryButton from './PrimaryButton';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({icon, title, message, actionLabel, onAction}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={64} color={colors.muted} />
      <Text className="mt-4 text-lg font-bold text-primary">{title}</Text>
      {!!message && <Text className="mt-2 text-center text-secondary">{message}</Text>}
      {!!actionLabel && onAction && (
        <PrimaryButton title={actionLabel} onPress={onAction} className="mt-6 px-8" />
      )}
    </View>
  );
}
