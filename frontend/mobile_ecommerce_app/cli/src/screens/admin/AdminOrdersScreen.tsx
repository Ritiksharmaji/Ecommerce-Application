import React, {useState} from 'react';
import {FlatList, RefreshControl, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import Toast from 'react-native-toast-message';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import {Ionicons} from '@/components/icons';
import {getOrderStatusStyle} from '@/constants/orderStatus';
import {useAsync} from '@/hooks/useAsync';
import {orderApi} from '@/services/api';
import {colors} from '@/theme';
import type {Order, OrderStatus} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';
import {formatDate, formatPrice} from '@/utils/format';
import OrderStatusSheet from './components/OrderStatusSheet';

function InfoBlock({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <View className="mb-3 rounded-lg bg-surface p-3">
      <Text className="mb-1 text-xs font-bold text-secondary">{label}</Text>
      {children}
    </View>
  );
}

function AdminOrderCard({order, onEditStatus}: {order: Order; onEditStatus: () => void}) {
  const customer = typeof order.user === 'object' ? order.user : undefined;
  const address = order.shippingAddress;
  const statusStyle = getOrderStatusStyle(order.orderStatus);

  return (
    <View className="mb-4 rounded-xl border border-border bg-background p-4 shadow-sm">
      <View className="mb-2 flex-row justify-between">
        <Text className="text-sm font-medium text-gray-400">Order #{order.orderNumber}</Text>
        <Text className="text-xs text-secondary">{formatDate(order.createdAt)}</Text>
      </View>

      <InfoBlock label="CUSTOMER">
        <Text className="font-medium text-primary">{customer?.name ?? 'Unknown user'}</Text>
        {!!customer?.email && <Text className="text-xs text-secondary">{customer.email}</Text>}
      </InfoBlock>

      <InfoBlock label="SHIPPING ADDRESS">
        <Text className="text-xs text-primary">
          {[address?.street, address?.city, address?.state, address?.zipCode, address?.country]
            .filter(Boolean)
            .join(', ')}
        </Text>
      </InfoBlock>

      <Text className="mb-2 text-xs font-bold text-secondary">ITEMS</Text>
      {order.items.map(item => (
        <View key={item._id} className="mb-1 flex-row justify-between">
          <Text className="flex-1 text-xs text-secondary">
            {item.quantity}× {item.product.name ?? item.name}
            {!!item.size && <Text className="text-gray-400"> ({item.size})</Text>}
          </Text>
          <Text className="text-xs font-bold text-secondary">{formatPrice(item.price)}</Text>
        </View>
      ))}

      <View className="mt-2 flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</Text>
        <TouchableOpacity
          onPress={onEditStatus}
          className={`flex-row items-center rounded-full px-4 py-2 ${statusStyle.container}`}
          accessibilityLabel={`Status ${order.orderStatus}, change`}>
          <Text className={`mr-2 text-xs font-bold uppercase tracking-wide ${statusStyle.text}`}>
            {order.orderStatus}
          </Text>
          <Ionicons name="pencil" size={12} color={colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminOrdersScreen() {
  const {data: orders, setData: setOrders, loading, refreshing, reload} = useAsync(orderApi.getAll);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: OrderStatus) => {
    if (!selected) {
      return;
    }
    setUpdating(true);
    try {
      await orderApi.updateStatus(selected._id, status);
      setOrders(prev =>
        (prev ?? []).map(o => (o._id === selected._id ? {...o, orderStatus: status} : o)),
      );
      Toast.show({type: 'success', text1: 'Order updated', text2: `Marked as ${status}`});
    } catch (error) {
      Toast.show({type: 'error', text1: 'Update failed', text2: getErrorMessage(error)});
    } finally {
      setUpdating(false);
      setSelected(null);
    }
  };

  if (loading) {
    return <LoadingView className="bg-surface" />;
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={orders ?? []}
        keyExtractor={item => item._id}
        contentContainerClassName="flex-grow p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
        renderItem={({item}) => (
          <AdminOrderCard order={item} onEditStatus={() => setSelected(item)} />
        )}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders found" />}
      />
      <OrderStatusSheet
        visible={!!selected}
        current={selected?.orderStatus}
        updating={updating}
        onSelect={updateStatus}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}
