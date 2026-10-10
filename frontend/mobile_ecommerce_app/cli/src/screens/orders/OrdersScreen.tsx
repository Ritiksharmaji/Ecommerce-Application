import React from 'react';
import {FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppHeader from '@/components/common/AppHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import OrderCard from '@/components/order/OrderCard';
import {useAuth} from '@/context/AuthContext';
import {useAsync} from '@/hooks/useAsync';
import type {RootStackScreenProps} from '@/navigation/types';
import {orderApi} from '@/services/api';

export default function OrdersScreen({navigation}: RootStackScreenProps<'Orders'>) {
  const {isSignedIn} = useAuth();
  const {
    data: orders,
    loading,
    refreshing,
    error,
    reload,
  } = useAsync(() => (isSignedIn ? orderApi.getMine() : Promise.resolve([])), [isSignedIn]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader title="My Orders" showBack />

      {!isSignedIn ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to see your orders"
          actionLabel="Sign In"
          onAction={() => navigation.navigate('SignIn')}
        />
      ) : loading ? (
        <LoadingView className="bg-surface" />
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={item => item._id}
          contentContainerClassName="flex-grow p-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
          renderItem={({item}) => (
            <OrderCard
              order={item}
              onPress={() => navigation.push('OrderDetails', {orderId: item._id})}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={error ? 'Could not load orders' : 'No orders yet'}
              message={error ?? 'Your orders will appear here.'}
              actionLabel={error ? 'Retry' : 'Start Shopping'}
              onAction={error ? reload : () => navigation.navigate('MainTabs', {screen: 'Home'})}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
