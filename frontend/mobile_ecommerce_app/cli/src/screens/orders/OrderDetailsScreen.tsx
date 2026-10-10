import React from 'react';
import {Image, ScrollView, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppHeader from '@/components/common/AppHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import {Ionicons} from '@/components/icons';
import StatusBadge from '@/components/order/StatusBadge';
import {useAsync} from '@/hooks/useAsync';
import type {RootStackScreenProps} from '@/navigation/types';
import {orderApi} from '@/services/api';
import {colors} from '@/theme';
import type {Order, OrderStatus} from '@/types/models';
import {formatDate, formatPrice} from '@/utils/format';

const PROGRESS: {title: string; reachedBy: OrderStatus[]}[] = [
  {title: 'Order Placed', reachedBy: ['placed', 'processing', 'shipped', 'delivered']},
  {title: 'Processing', reachedBy: ['processing', 'shipped', 'delivered']},
  {title: 'Shipped', reachedBy: ['shipped', 'delivered']},
  {title: 'Delivered', reachedBy: ['delivered']},
];

function Card({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View className="mb-4 rounded-xl border border-border bg-background p-4">
      <Text className="mb-4 text-lg font-bold text-primary">{title}</Text>
      {children}
    </View>
  );
}

function Row({label, value, bold}: {label: string; value: React.ReactNode; bold?: boolean}) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className={bold ? 'text-lg font-bold text-primary' : 'text-secondary'}>{label}</Text>
      {typeof value === 'string' ? (
        <Text className={`capitalize text-primary ${bold ? 'text-lg font-bold' : 'font-medium'}`}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

function OrderProgress({order}: {order: Order}) {
  if (order.orderStatus === 'cancelled') {
    return <StatusBadge status="cancelled" />;
  }
  return (
    <>
      {PROGRESS.map((step, index) => {
        const done = step.reachedBy.includes(order.orderStatus);
        const isLast = index === PROGRESS.length - 1;
        return (
          <View key={step.title} className="flex-row">
            <View className="mr-4 items-center">
              <View className={`h-3 w-3 rounded-full ${done ? 'bg-primary' : 'bg-gray-300'}`} />
              {!isLast && (
                <View className={`w-0.5 flex-1 ${done ? 'bg-primary' : 'bg-gray-300'}`} />
              )}
            </View>
            <View className={isLast ? '' : 'pb-4'}>
              <Text className={`font-bold ${done ? 'text-primary' : 'text-gray-400'}`}>
                {step.title}
              </Text>
              {index === 0 && (
                <Text className="text-xs text-secondary">{formatDate(order.createdAt)}</Text>
              )}
            </View>
          </View>
        );
      })}
    </>
  );
}

export default function OrderDetailsScreen({route}: RootStackScreenProps<'OrderDetails'>) {
  const {orderId} = route.params;
  const {data: order, loading} = useAsync(() => orderApi.getById(orderId), [orderId]);

  if (loading) {
    return <LoadingView className="bg-surface" />;
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <AppHeader title="Order" showBack />
        <EmptyState icon="alert-circle-outline" title="Order not found" />
      </SafeAreaView>
    );
  }

  const address = order.shippingAddress;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader title={`Order #${order.orderNumber}`} showBack />

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-4">
        <Card title="Order Status">
          <OrderProgress order={order} />
        </Card>

        <Card title="Products">
          {order.items.map((item, index) => (
            <View
              key={item._id}
              className={`flex-row ${
                index < order.items.length - 1 ? 'mb-4 border-b border-border pb-4' : ''
              }`}>
              {!!item.product.images?.[0] && (
                <Image
                  source={{uri: item.product.images[0]}}
                  className="h-16 w-16 rounded-lg bg-surface"
                  resizeMode="contain"
                />
              )}
              <View className="ml-3 flex-1 justify-center">
                <Text className="font-medium text-primary" numberOfLines={1}>
                  {item.name}
                </Text>
                {!!item.size && <Text className="text-xs text-secondary">Size: {item.size}</Text>}
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="font-bold text-primary">{formatPrice(item.price)}</Text>
                  <Text className="text-xs text-secondary">Qty: {item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <Card title="Shipping Details">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={20} color={colors.secondary} />
            <Text className="ml-2 flex-1 text-secondary">
              {[address?.street, address?.city, address?.state, address?.zipCode, address?.country]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
          {!!order.notes && <Text className="mt-2 text-secondary">Notes: {order.notes}</Text>}
        </Card>

        <Card title="Payment Summary">
          <Row label="Payment Method" value={order.paymentMethod} />
          <Row
            label="Payment Status"
            value={<StatusBadge status={order.paymentStatus} kind="payment" />}
          />
          <View className="my-2 h-px bg-border" />
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          <Row label="Shipping" value={formatPrice(order.shippingCost)} />
          <Row label="Tax" value={formatPrice(order.tax)} />
          <View className="my-2 h-px bg-border" />
          <Row label="Total" value={formatPrice(order.totalAmount)} bold />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
