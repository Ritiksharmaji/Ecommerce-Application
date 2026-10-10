import React from 'react';
import {FlatList, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CartItemRow from '@/components/cart/CartItemRow';
import AppHeader from '@/components/common/AppHeader';
import EmptyState from '@/components/common/EmptyState';
import PrimaryButton from '@/components/common/PrimaryButton';
import PriceSummary from '@/components/order/PriceSummary';
import {shippingFor} from '@/constants/app';
import {useCart} from '@/context/CartContext';
import type {MainTabScreenProps} from '@/navigation/types';

export default function CartScreen({navigation}: MainTabScreenProps<'Cart'>) {
  const {cartItems, cartTotal, removeFromCart, updateQuantity} = useCart();
  const shipping = shippingFor(cartTotal);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader title="My Cart" />

      {cartItems.length === 0 ? (
        <EmptyState
          icon="bag-outline"
          title="Your cart is empty"
          message="Browse the shop and add something you like."
          actionLabel="Start Shopping"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => `${item.productId}-${item.size}`}
            contentContainerClassName="px-4 pt-4"
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => (
              <CartItemRow
                item={item}
                onRemove={() => removeFromCart(item.productId, item.size)}
                onChangeQuantity={quantity => updateQuantity(item.productId, quantity, item.size)}
              />
            )}
          />
          <View className="rounded-t-3xl bg-background p-4 shadow-sm">
            <PriceSummary subtotal={cartTotal} shipping={shipping} total={cartTotal + shipping} />
            <PrimaryButton
              title="Checkout"
              rounded
              onPress={() => navigation.navigate('Checkout')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
