import React, {useEffect, useState} from 'react';
import {Text} from '@/components/ui/Typography';
import {View} from 'react-native';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import {useChat} from '@/context/ChatContext';
import {addressApi} from '@/services/api';
import type {ChatAction} from '@/types/chat';
import type {Address} from '@/types/models';
import ConfirmActionCard from './ConfirmActionCard';

interface AccountActionCardProps {
  action: ChatAction;
  disabled: boolean;
  onDone: (ok: boolean, result: string) => void;
}

/** Confirmation cards for clear_cart, delete_address, sign_out and delete_account. */
export default function AccountActionCard({action, disabled, onDone}: AccountActionCardProps) {
  const {user, signOut, deleteAccount} = useAuth();
  const {cartItems, clearCart} = useCart();
  const {endChat} = useChat();

  switch (action.name) {
    case 'clear_cart':
      return (
        <ConfirmActionCard
          title="Empty your cart?"
          message={`Removes all ${cartItems.length} item${
            cartItems.length === 1 ? '' : 's'
          } from your cart.`}
          confirmLabel="Empty cart"
          danger
          disabled={disabled}
          onCancel={() => onDone(false, 'The user kept the cart.')}
          onConfirm={async () => {
            clearCart();
            onDone(true, 'The cart is now empty.');
          }}
        />
      );
    case 'delete_address':
      return (
        <DeleteAddressCard
          addressId={String(action.input.addressId)}
          disabled={disabled}
          onDone={onDone}
        />
      );
    case 'sign_out':
      return (
        <ConfirmActionCard
          title="Sign out?"
          message={user?.email ? `You are signed in as ${user.email}.` : undefined}
          confirmLabel="Sign out"
          disabled={disabled}
          onCancel={() => onDone(false, 'The user stayed signed in.')}
          onConfirm={() =>
            endChat(
              signOut,
              "You're signed out. Ask me anything or sign in again to see your cart and orders.",
            )
          }
        />
      );
    case 'delete_account':
      return (
        <ConfirmActionCard
          title="Delete your account permanently?"
          message="This removes your account, saved addresses, cart and wishlist. It cannot be undone."
          confirmLabel="Delete account"
          danger
          needPassword
          disabled={disabled}
          onCancel={() => onDone(false, 'The user kept their account.')}
          onConfirm={password =>
            endChat(
              () => deleteAccount(password),
              'Your account has been deleted. Thanks for shopping with Shopvra.',
            )
          }
        />
      );
    default:
      return null;
  }
}

function DeleteAddressCard({
  addressId,
  disabled,
  onDone,
}: {
  addressId: string;
  disabled: boolean;
  onDone: (ok: boolean, result: string) => void;
}) {
  const [address, setAddress] = useState<Address | null | undefined>(undefined);

  useEffect(() => {
    addressApi
      .getAll()
      .then(list => setAddress(list.find(a => a._id === addressId) ?? null))
      .catch(() => setAddress(null));
  }, [addressId]);

  useEffect(() => {
    if (address === null && !disabled) onDone(false, 'Address not found.');
  }, [address, disabled, onDone]);

  if (address === undefined) {
    return (
      <View className="rounded-2xl border border-border p-4">
        <Text className="text-sm text-secondary">Loading address...</Text>
      </View>
    );
  }
  if (address === null) return null;
  return (
    <ConfirmActionCard
      title="Delete this address?"
      message={`${address.type}: ${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`}
      confirmLabel="Delete"
      danger
      disabled={disabled}
      onCancel={() => onDone(false, 'The user kept the address.')}
      onConfirm={async () => {
        await addressApi.remove(address._id);
        onDone(true, 'Address deleted.');
      }}
    />
  );
}
