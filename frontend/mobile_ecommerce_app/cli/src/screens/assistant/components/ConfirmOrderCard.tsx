import React, {useEffect, useState} from 'react';
import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import PrimaryButton from '@/components/common/PrimaryButton';
import {Text} from '@/components/ui/Typography';
import {shippingFor} from '@/constants/app';
import {useCart} from '@/context/CartContext';
import PaymentWebViewModal, {
  PAYMENT_CANCEL_URL,
  PAYMENT_SUCCESS_URL,
} from '@/screens/checkout/components/PaymentWebViewModal';
import {addressApi, orderApi, paymentApi} from '@/services/api';
import {colors} from '@/theme';
import type {Address} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';
import {formatPrice} from '@/utils/format';

interface ConfirmOrderCardProps {
  input: Record<string, any>;
  disabled: boolean;
  onDone: (ok: boolean, result: string) => void;
}

/**
 * Order summary with Confirm. Places the order from the current cart (same flow as Checkout); card
 * payments open Stripe's hosted page - the assistant never sees card details.
 */
export default function ConfirmOrderCard({input, disabled, onDone}: ConfirmOrderCardProps) {
  const {cartItems, cartTotal, clearCart, flush, refreshCart} = useCart();
  const [address, setAddress] = useState<Address | null | undefined>(undefined);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const paymentMethod: 'cash' | 'stripe' = input.paymentMethod === 'stripe' ? 'stripe' : 'cash';
  const shipping = shippingFor(cartTotal);

  useEffect(() => {
    addressApi
      .getAll()
      .then(list => setAddress(list.find(a => a._id === input.addressId) ?? null))
      .catch(() => setAddress(null));
  }, [input.addressId]);

  const confirm = async () => {
    if (!address) return;
    setPlacing(true);
    setError(null);
    try {
      await flush(); // the order is built from the server cart
      const {street, city, state, zipCode, country} = address;
      const order = await orderApi.create({
        shippingAddress: {street, city, state, zipCode, country},
        paymentMethod,
        notes: input.notes || undefined,
      });
      setOrderNumber(order.orderNumber);
      if (paymentMethod === 'stripe') {
        setPaymentUrl(
          await paymentApi.createCheckoutSession({
            orderId: order._id,
            items: cartItems,
            shipping: order.shippingCost,
            successUrl: PAYMENT_SUCCESS_URL,
            cancelUrl: PAYMENT_CANCEL_URL,
          }),
        );
        return;
      }
      clearCart();
      onDone(
        true,
        `Order #${order.orderNumber} placed with cash on delivery. Total ${formatPrice(
          order.totalAmount,
        )}.`,
      );
    } catch (e) {
      setError(getErrorMessage(e, 'Could not place the order'));
    } finally {
      setPlacing(false);
    }
  };

  if (address === undefined) {
    return (
      <View className="items-center rounded-2xl border border-border bg-background p-6">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-border bg-background p-4">
      <Text className="mb-3 text-base font-bold text-primary">Confirm your order</Text>
      {cartItems.map(item => (
        <View key={`${item.productId}-${item.size}`} className="mb-1 flex-row justify-between">
          <Text className="mr-2 flex-1 text-xs text-secondary" numberOfLines={1}>
            {item.quantity} x {item.product.name}
            {item.size ? ` (${item.size})` : ''}
          </Text>
          <Text className="text-xs font-semibold text-primary">
            {formatPrice(item.price * item.quantity)}
          </Text>
        </View>
      ))}
      <View className="my-2 h-px bg-border" />
      <Row label="Shipping" value={formatPrice(shipping)} />
      <Row label="Total" value={formatPrice(cartTotal + shipping)} bold />
      <View className="my-2 h-px bg-border" />
      <Text className="text-xs text-secondary">Deliver to</Text>
      <Text className="mb-2 text-sm text-primary">
        {address
          ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`
          : 'Address not found'}
      </Text>
      <Text className="text-xs text-secondary">Payment</Text>
      <Text className="mb-3 text-sm text-primary">
        {paymentMethod === 'stripe' ? 'Card (secure Stripe page)' : 'Cash on delivery'}
      </Text>
      {!!error && <Text className="mb-2 text-xs text-error">{error}</Text>}
      {!disabled && (
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onDone(false, 'The user cancelled the order.')}
            className="flex-1 items-center justify-center rounded-xl border border-border py-3">
            <Text className="font-semibold text-primary">Cancel</Text>
          </TouchableOpacity>
          <PrimaryButton
            title={paymentMethod === 'stripe' ? 'Pay now' : 'Place order'}
            onPress={confirm}
            loading={placing}
            disabled={!address || cartItems.length === 0}
            className="flex-1 py-3"
          />
        </View>
      )}
      <PaymentWebViewModal
        url={paymentUrl}
        onSuccess={() => {
          setPaymentUrl(null);
          clearCart();
          onDone(true, `Payment successful for order #${orderNumber}.`);
        }}
        onCancel={() => {
          setPaymentUrl(null);
          refreshCart();
          onDone(false, `Card payment cancelled. Order #${orderNumber} is waiting for payment.`);
        }}
      />
    </View>
  );
}

function Row({label, value, bold}: {label: string; value: string; bold?: boolean}) {
  return (
    <View className="mb-1 flex-row justify-between">
      <Text className={bold ? 'font-bold text-primary' : 'text-xs text-secondary'}>{label}</Text>
      <Text className={bold ? 'font-bold text-primary' : 'text-xs text-primary'}>{value}</Text>
    </View>
  );
}
