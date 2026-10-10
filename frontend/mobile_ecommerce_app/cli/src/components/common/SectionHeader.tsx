import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({title, actionLabel, onAction}: SectionHeaderProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Text className="text-lg font-bold text-primary">{title}</Text>
      {!!actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-sm text-secondary">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
