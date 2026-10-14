import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@/components/icons';
import {useAppNavigation} from '@/navigation/hooks';
import {colors} from '@/theme';

/** Floating button that opens the Shopvra shopping assistant. */
export default function AssistantFab({bottom = 24}: {bottom?: number}) {
  const navigation = useAppNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Assistant')}
      className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
      style={[styles.fab, {bottom}]}
      accessibilityRole="button"
      accessibilityLabel="Ask the Shopvra assistant">
      <Ionicons name="sparkles" size={24} color={colors.accent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({fab: {elevation: 6}});
