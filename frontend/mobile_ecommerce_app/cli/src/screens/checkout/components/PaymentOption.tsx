import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons, type IconName} from '@/components/icons';
import {colors} from '@/theme';

interface PaymentOptionProps {
  icon: IconName;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}

export default function PaymentOption({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: PaymentOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      className={`mb-4 flex-row items-center rounded-xl border-2 bg-background p-4 shadow-sm ${
        selected ? 'border-primary' : 'border-transparent'
      }`}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-primary">{title}</Text>
        <Text className="mt-1 text-xs text-secondary">{subtitle}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
    </TouchableOpacity>
  );
}
