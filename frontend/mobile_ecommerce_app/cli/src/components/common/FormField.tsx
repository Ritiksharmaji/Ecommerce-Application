import React from 'react';
import {View, type TextInputProps} from 'react-native';
import {Text, TextInput} from '@/components/ui/Typography';
import {colors} from '@/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  containerClassName?: string;
}

/** Labelled text input used by every form. */
export default function FormField({
  label,
  containerClassName = 'mb-4',
  multiline,
  className = '',
  ...inputProps
}: FormFieldProps) {
  return (
    <View className={containerClassName}>
      <Text className="mb-1 text-xs font-bold uppercase text-secondary">{label}</Text>
      <TextInput
        className={`rounded-xl bg-surface p-4 text-primary ${multiline ? 'h-24' : ''} ${className}`}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
        {...inputProps}
      />
    </View>
  );
}
