import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppHeader from '@/components/common/AppHeader';
import FormField from '@/components/common/FormField';
import PrimaryButton from '@/components/common/PrimaryButton';
import PriceSummary from '@/components/order/PriceSummary';
import {shippingFor} from '@/constants/app';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import type {RootStackScreenProps} from '@/navigation/types';
import {addressApi, orderApi, paymentApi} from '@/services/api';
import type {PaymentMethod, ShippingAddress} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';
import PaymentOption from './components/PaymentOption';
import PaymentWebViewModal, {
  PAYMENT_CANCEL_URL,
  PAYMENT_SUCCESS_URL,
} from './components/PaymentWebViewModal';

const EMPTY_ADDRESS: ShippingAddress = {street: '', city: '', state: '', zipCode: '', country: ''};

export default function CheckoutScreen({navigation}: RootStackScreenProps<'Checkout'>) {
  const {isSignedIn} = useAuth();
  const {cartItems, cartTotal, clearCart, flush, refreshCart} = useCart();

  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [placing, setPlacing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const shipping = shippingFor(cartTotal);
  const addressComplete = Object.values(address).every(value => value.trim());

  // Prefill with the default saved address.
  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    addressApi
      .getAll()
      .then(([saved]) => {
        if (saved) {
          const {street, city, state, zipCode, country} = saved;
          setAddress({street, city, state, zipCode, country});
          setHasSavedAddress(true);
        }
      })
      .catch(() => undefined);
  }, [isSignedIn]);

  const updateAddress = (key: keyof ShippingAddress) => (value: string) =>
    setAddress(prev => ({...prev, [key]: value}));

  const finish = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    Toast.show({type, text1: title, text2: message});
    navigation.replace('Orders');
  };

  const placeOrder = async () => {
    if (!isSignedIn) {
      Toast.show({
        type: 'info',
        text1: 'Login required',
        text2: 'Please sign in to place an order',
      });
      navigation.navigate('SignIn');
      return;
    }
    if (cartItems.length === 0) {
      Toast.show({type: 'error', text1: 'Cart empty', text2: 'Add items before checking out'});
      return;
    }
    if (!addressComplete) {
      Toast.show({
        type: 'error',
        text1: 'Address required',
        text2: 'Please fill in all address fields',
      });
      return;
    }

    setPlacing(true);
    try {
      // The order is built from the server cart: wait for pending cart updates first.
      await flush();
      const order = await orderApi.create({shippingAddress: address, paymentMethod, notes});

      if (!hasSavedAddress) {
        addressApi.create({...address, type: 'Home', isDefault: true}).catch(() => undefined);
        setHasSavedAddress(true);
      }

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

      // Cash orders: the server already cleared the cart.
      clearCart();
      finish('Order placed', `Order #${order.orderNumber}`);
    } catch (error) {
      Toast.show({type: 'error', text1: 'Order failed', text2: getErrorMessage(error)});
    } finally {
      setPlacing(false);
    }
  };

  // The Stripe webhook marks the order paid and clears the server cart.
  const onPaymentSuccess = () => {
    setPaymentUrl(null);
    clearCart();
    finish('Payment successful', 'Your order is confirmed');
  };

  const onPaymentCancel = () => {
    setPaymentUrl(null);
    refreshCart();
    finish('Payment cancelled', 'Your order is awaiting payment', 'error');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <AppHeader title="Checkout" showBack />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4"
          keyboardShouldPersistTaps="handled">
          <Text className="mb-4 text-lg font-bold text-primary">Shipping Address</Text>
          <FormField
            label="Street"
            autoComplete="street-address"
            value={address.street}
            onChangeText={updateAddress('street')}
          />
          <View className="flex-row gap-3">
            <FormField
              label="City"
              containerClassName="mb-4 flex-1"
              value={address.city}
              onChangeText={updateAddress('city')}
            />
            <FormField
              label="State"
              containerClassName="mb-4 flex-1"
              value={address.state}
              onChangeText={updateAddress('state')}
            />
          </View>
          <View className="flex-row gap-3">
            <FormField
              label="Zip Code"
              containerClassName="mb-4 flex-1"
              keyboardType="number-pad"
              autoComplete="postal-code"
              value={address.zipCode}
              onChangeText={updateAddress('zipCode')}
            />
            <FormField
              label="Country"
              containerClassName="mb-4 flex-1"
              value={address.country}
              onChangeText={updateAddress('country')}
            />
          </View>
          <FormField
            label="Delivery notes (optional)"
            placeholder="e.g. Leave at the front door"
            value={notes}
            onChangeText={setNotes}
          />

          <Text className="mb-4 mt-2 text-lg font-bold text-primary">Payment Method</Text>
          <PaymentOption
            icon="cash-outline"
            title="Cash on Delivery"
            subtitle="Pay when you receive the order"
            selected={paymentMethod === 'cash'}
            onPress={() => setPaymentMethod('cash')}
          />
          <PaymentOption
            icon="card-outline"
            title="Pay with Card"
            subtitle="Credit or debit card (Stripe)"
            selected={paymentMethod === 'stripe'}
            onPress={() => setPaymentMethod('stripe')}
          />
        </ScrollView>

        <View className="border-t border-border bg-background p-4 shadow-lg">
          <PriceSummary subtotal={cartTotal} shipping={shipping} total={cartTotal + shipping} />
          <PrimaryButton title="Place Order" loading={placing} onPress={placeOrder} />
        </View>
      </KeyboardAvoidingView>

      <PaymentWebViewModal
        url={paymentUrl}
        onSuccess={onPaymentSuccess}
        onCancel={onPaymentCancel}
      />
    </SafeAreaView>
  );
}
