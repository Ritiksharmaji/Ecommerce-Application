import React from 'react';
import {Image, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import {colors} from '@/theme';
import type {CartItem} from '@/types/models';
import {formatPrice} from '@/utils/format';

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onChangeQuantity: (quantity: number) => void;
}

export default function CartItemRow({item, onRemove, onChangeQuantity}: CartItemRowProps) {
  return (
    <View className="mb-4 flex-row rounded-xl bg-background p-3">
      <View className="mr-3 h-20 w-20 overflow-hidden rounded-lg bg-surface">
        {!!item.product.images[0] && (
          <Image
            source={{uri: item.product.images[0]}}
            className="h-full w-full"
            resizeMode="cover"
          />
        )}
      </View>

      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="mb-1 text-sm font-medium text-primary">{item.product.name}</Text>
            {!!item.size && <Text className="text-xs text-secondary">Size: {item.size}</Text>}
          </View>
          <TouchableOpacity onPress={onRemove} accessibilityLabel="Remove item">
            <Ionicons name="close-circle-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-primary">{formatPrice(item.price)}</Text>
          <View className="flex-row items-center rounded-full bg-surface px-2 py-1">
            <TouchableOpacity
              className="p-1"
              onPress={() => onChangeQuantity(item.quantity - 1)}
              accessibilityLabel="Decrease quantity">
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text className="mx-3 font-medium text-primary">{item.quantity}</Text>
            <TouchableOpacity
              className="p-1"
              onPress={() => onChangeQuantity(item.quantity + 1)}
              accessibilityLabel="Increase quantity">
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
