import React from 'react';
import {View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {getOrderStatusStyle, getPaymentStatusStyle} from '@/constants/orderStatus';

interface StatusBadgeProps {
  status: string;
  kind?: 'order' | 'payment';
}

export default function StatusBadge({status, kind = 'order'}: StatusBadgeProps) {
  const style = kind === 'payment' ? getPaymentStatusStyle(status) : getOrderStatusStyle(status);
  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.container}`}>
      <Text className={`text-xs font-bold capitalize ${style.text}`}>{status}</Text>
    </View>
  );
}
