import React from 'react';
import {View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {formatPrice} from '@/utils/format';

interface PriceSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
}

/** Subtotal / shipping / total block used by cart, checkout and order details. */
export default function PriceSummary({subtotal, shipping, total}: PriceSummaryProps) {
  return (
    <View>
      <View className="mb-2 flex-row justify-between">
        <Text className="text-secondary">Subtotal</Text>
        <Text className="font-bold text-primary">{formatPrice(subtotal)}</Text>
      </View>
      <View className="mb-4 flex-row justify-between">
        <Text className="text-secondary">Shipping</Text>
        <Text className="font-bold text-primary">{formatPrice(shipping)}</Text>
      </View>
      <View className="mb-4 h-px bg-border" />
      <View className="mb-4 flex-row justify-between">
        <Text className="text-lg font-bold text-primary">Total</Text>
        <Text className="text-lg font-bold text-primary">{formatPrice(total)}</Text>
      </View>
    </View>
  );
}
