import {useEffect, useRef} from 'react';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import {useChat} from '@/context/ChatContext';
import {useAppNavigation} from '@/navigation/hooks';
import {productApi} from '@/services/api';
import type {ChatAction} from '@/types/chat';
import {getErrorMessage} from '@/utils/errors';

const TABS = ['Home', 'Cart', 'Favorites', 'Profile'] as const;

/**
 * Runs the assistant's "instant" actions (navigate, add_to_cart) as soon as they arrive and reports the
 * outcome. Interactive actions (address form, order confirmation) are rendered as cards instead.
 */
export function useAssistantActions() {
  const navigation = useAppNavigation();
  const {isSignedIn} = useAuth();
  const {addToCart} = useCart();
  const {items, resolveAction} = useChat();
  const started = useRef(new Set<string>());

  useEffect(() => {
    for (const item of items) {
      if (
        item.kind !== 'action' ||
        item.status !== 'pending' ||
        started.current.has(item.action.id)
      )
        continue;
      const {action} = item;
      if (action.name === 'navigate') {
        started.current.add(action.id);
        resolveAction(action.id, ...runNavigate(action));
      } else if (action.name === 'add_to_cart') {
        started.current.add(action.id);
        runAddToCart(action).then(([ok, result]) => resolveAction(action.id, ok, result));
      }
    }
  });

  function runNavigate(action: ChatAction): [boolean, string] {
    const {screen, productId, orderId, category} = action.input;
    if ((TABS as readonly string[]).includes(screen)) {
      navigation.navigate('MainTabs', {screen});
    } else if (screen === 'Shop') {
      navigation.navigate('Shop', {
        category: category && category !== 'Any' ? category : undefined,
      });
    } else if (screen === 'ProductDetails') {
      navigation.push('ProductDetails', {productId});
    } else if (screen === 'OrderDetails') {
      navigation.push('OrderDetails', {orderId});
    } else if (screen === 'Checkout' || screen === 'Orders') {
      navigation.navigate(screen);
    } else if (screen === 'SignIn') {
      if (isSignedIn) return [true, 'The user is already signed in.'];
      navigation.navigate('SignIn');
    } else {
      return [false, `Unknown screen ${screen}`];
    }
    return [true, `Opened the ${screen} screen.`];
  }

  async function runAddToCart(action: ChatAction): Promise<[boolean, string]> {
    try {
      const product = await productApi.getById(action.input.productId);
      const size = String(action.input.size ?? '');
      if (product.sizes.length && !product.sizes.includes(size)) {
        return [
          false,
          `Size "${size}" is not available. Available sizes: ${product.sizes.join(', ')}.`,
        ];
      }
      if (product.stock <= 0) return [false, `${product.name} is out of stock.`];
      const quantity = Math.min(Math.max(Number(action.input.quantity) || 1, 1), 10);
      for (let i = 0; i < quantity; i++) addToCart(product, size);
      return [
        true,
        `Added ${quantity} x ${product.name}${size ? ` (size ${size})` : ''} to the cart.`,
      ];
    } catch (error) {
      return [false, `Could not add to cart: ${getErrorMessage(error)}`];
    }
  }
}
