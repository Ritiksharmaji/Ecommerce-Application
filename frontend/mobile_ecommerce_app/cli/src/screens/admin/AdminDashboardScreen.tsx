import React from 'react';
import {RefreshControl, ScrollView, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import LoadingView from '@/components/common/LoadingView';
import StatusBadge from '@/components/order/StatusBadge';
import {useAsync} from '@/hooks/useAsync';
import {adminApi} from '@/services/api';
import type {Order} from '@/types/models';
import {formatDate, formatPrice} from '@/utils/format';

function StatCard({label, value}: {label: string; value: string}) {
  return (
    <View className="mb-4 w-[48%] rounded-2xl border border-border bg-background p-5">
      <Text className="mb-1 text-xl font-bold text-primary">{value}</Text>
      <Text className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</Text>
    </View>
  );
}

function RecentOrder({order}: {order: Order}) {
  const customer = typeof order.user === 'object' ? order.user?.name : undefined;
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View className="mb-3 rounded-2xl border border-border bg-background p-5">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-primary">
            #{order.orderNumber} · {units} item{units === 1 ? '' : 's'}
          </Text>
          <Text className="mt-1 text-xs text-secondary">{formatDate(order.createdAt)}</Text>
        </View>
        <StatusBadge status={order.orderStatus} />
      </View>
      {order.items.map(item => (
        <Text key={item._id} className="mt-1 text-xs text-secondary">
          {item.name} × {item.quantity}
        </Text>
      ))}
      <View className="my-3 h-px bg-border" />
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-surface">
            <Text className="text-xs font-bold text-primary">
              {(customer ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-sm text-secondary">{customer ?? 'Unknown user'}</Text>
        </View>
        <Text className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const {data: stats, loading, refreshing, error, reload} = useAsync(adminApi.getStats);

  if (loading) {
    return <LoadingView className="bg-surface" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
      {!!error && <Text className="mb-4 text-center text-error">{error}</Text>}

      <Text className="mb-4 text-2xl font-bold tracking-tight text-primary">Overview</Text>
      <View className="mb-4 flex-row flex-wrap justify-between">
        <StatCard label="Total Revenue" value={formatPrice(stats?.totalRevenue ?? 0)} />
        <StatCard label="Total Orders" value={String(stats?.totalOrders ?? 0)} />
        <StatCard label="Products" value={String(stats?.totalProducts ?? 0)} />
        <StatCard label="Users" value={String(stats?.totalUsers ?? 0)} />
      </View>

      <Text className="mb-4 text-2xl font-bold tracking-tight text-primary">Recent Orders</Text>
      {stats?.recentOrders.length ? (
        stats.recentOrders.map(order => <RecentOrder key={order._id} order={order} />)
      ) : (
        <View className="items-center rounded-2xl border border-border bg-background p-6">
          <Text className="text-secondary">No recent orders</Text>
        </View>
      )}
    </ScrollView>
  );
}
