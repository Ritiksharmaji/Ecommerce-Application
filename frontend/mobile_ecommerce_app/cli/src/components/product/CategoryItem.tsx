import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import type {Category} from '@/constants/categories';
import {colors} from '@/theme';

interface CategoryItemProps {
  item: Category;
  isSelected: boolean;
  onPress: () => void;
}

export default function CategoryItem({item, isSelected, onPress}: CategoryItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mr-5 items-center"
      accessibilityRole="button"
      accessibilityState={{selected: isSelected}}>
      <View
        className={`mb-2 h-16 w-16 items-center justify-center rounded-full ${
          isSelected ? 'bg-primary' : 'bg-surface'
        }`}>
        <Ionicons name={item.icon} size={26} color={isSelected ? '#fff' : colors.primary} />
      </View>
      <Text
        numberOfLines={1}
        className={`w-16 text-center text-xs font-medium ${
          isSelected ? 'text-primary' : 'text-secondary'
        }`}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}
