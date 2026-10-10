import React, {ReactNode} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@/components/icons';
import {colors} from '@/theme';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for sign-in, sign-up and admin login: back button, title, keyboard handling. */
export default function AuthLayout({title, subtitle, onBack, children, footer}: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-3">
        <TouchableOpacity onPress={onBack} className="self-start" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-7 pb-8"
          keyboardShouldPersistTaps="handled">
          <View className="mb-8 items-center">
            <Text className="mb-2 text-3xl font-bold text-primary">{title}</Text>
            <Text className="text-center text-secondary">{subtitle}</Text>
          </View>
          {children}
          {footer && <View className="mt-10 flex-row justify-center">{footer}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
