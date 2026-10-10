import React from 'react';
import {Image, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import {colors} from '@/theme';
import type {Order} from '@/types/models';
import {formatDate, formatPrice} from '@/utils/format';
import StatusBadge from './StatusBadge';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  /** Admin list: show the customer's name. */
  showCustomer?: boolean;
}

export default function OrderCard({order, onPress, showCustomer}: OrderCardProps) {
  const customer = typeof order.user === 'object' ? order.user?.name : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4 rounded-xl border border-border bg-background p-4 shadow-sm">
      <View className="mb-2 flex-row justify-between">
        <Text className="font-bold text-primary">Order #{order.orderNumber}</Text>
        <Text className="text-sm text-secondary">{formatDate(order.createdAt)}</Text>
      </View>
      {showCustomer && !!customer && (
        <Text className="mb-2 text-sm text-secondary">Customer: {customer}</Text>
      )}

      <View className="mb-3 flex-row gap-2">
        <StatusBadge status={order.orderStatus} />
        <StatusBadge status={order.paymentStatus} kind="payment" />
      </View>

      <Text className="mb-2 text-xs text-secondary">
        Payment method:{' '}
        <Text className="font-medium capitalize text-primary">{order.paymentMethod}</Text>
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        {order.items.map(item => {
          const image = item.product.images?.[0];
          return (
            <View key={item._id} className="mr-3 rounded-md border border-border bg-surface p-1">
              {image ? (
                <Image source={{uri: image}} className="h-12 w-12 rounded-md" resizeMode="cover" />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-md bg-gray-200">
                  <Ionicons name="image-outline" size={20} color={colors.secondary} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View className="flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-secondary">Items: {order.items.length}</Text>
        <Text className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );
}
