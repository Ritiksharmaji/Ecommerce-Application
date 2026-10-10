import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import {CATEGORIES} from '@/constants/categories';
import {colors} from '@/theme';
import {DEFAULT_FILTERS, SORT_OPTIONS, type ProductFilters} from '@/utils/productFilters';

interface ShopFilterModalProps {
  visible: boolean;
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClose: () => void;
}

function Chip({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityState={{selected}}
      className={`rounded-full border px-4 py-2 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-background'
      }`}>
      <Text className={selected ? 'text-white' : 'text-primary'}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Bottom sheet with sort, category and price range. Changes apply on "Apply". */
export default function ShopFilterModal({
  visible,
  filters,
  onApply,
  onClose,
}: ShopFilterModalProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const update = (patch: Partial<ProductFilters>) => setDraft(prev => ({...prev, ...patch}));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="h-[80%] rounded-t-3xl bg-background p-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-primary">Filters</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close filters">
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-3 font-bold text-primary">Sort By</Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map(option => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={draft.sort === option.value}
                  onPress={() => update({sort: option.value})}
                />
              ))}
            </View>

            <Text className="mb-3 font-bold text-primary">Category</Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              <Chip label="All" selected={!draft.category} onPress={() => update({category: ''})} />
              {CATEGORIES.map(category => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={draft.category === category.name}
                  onPress={() => update({category: category.name})}
                />
              ))}
            </View>

            <Text className="mb-3 font-bold text-primary">Price Range</Text>
            <View className="mb-8 flex-row gap-4">
              <TextInput
                placeholder="Min"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={draft.minPrice}
                onChangeText={minPrice => update({minPrice})}
                className="flex-1 rounded-xl bg-surface px-4 py-3 text-primary"
              />
              <TextInput
                placeholder="Max"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={draft.maxPrice}
                onChangeText={maxPrice => update({maxPrice})}
                className="flex-1 rounded-xl bg-surface px-4 py-3 text-primary"
              />
            </View>
          </ScrollView>

          <View className="flex-row gap-4 border-t border-border pt-4">
            <TouchableOpacity
              className="flex-1 items-center rounded-full border border-gray-300 py-4"
              onPress={() => onApply({...DEFAULT_FILTERS, search: filters.search})}>
              <Text className="font-bold text-primary">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center rounded-full bg-primary py-4"
              onPress={() => onApply(draft)}>
              <Text className="font-bold text-white">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
