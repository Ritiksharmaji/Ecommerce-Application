import {useEffect, useRef} from 'react';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import {useChat} from '@/context/ChatContext';
import {useWishlist} from '@/context/WishlistContext';
import {useAppNavigation} from '@/navigation/hooks';
import {productApi} from '@/services/api';
import type {ChatAction} from '@/types/chat';
import {getErrorMessage} from '@/utils/errors';

const TABS = ['Home', 'Cart', 'Favorites', 'Profile'] as const;

/**
 * Runs the assistant's "instant" actions (navigate, add_to_cart, update_cart_item, update_wishlist) as soon
 * as they arrive and reports the outcome. Forms and destructive actions (sign in, address, order, clear cart,
 * delete address, sign out, delete account) are rendered as cards the user confirms instead.
 */
export function useAssistantActions() {
  const navigation = useAppNavigation();
  const {isSignedIn} = useAuth();
  const {cartItems, addToCart, updateQuantity, removeFromCart} = useCart();
  const {isInWishlist, toggleWishlist} = useWishlist();
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
      } else if (action.name === 'update_cart_item') {
        started.current.add(action.id);
        resolveAction(action.id, ...runUpdateCartItem(action));
      } else if (action.name === 'update_wishlist') {
        started.current.add(action.id);
        runUpdateWishlist(action).then(([ok, result]) => resolveAction(action.id, ok, result));
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

  function runUpdateCartItem(action: ChatAction): [boolean, string] {
    const productId = String(action.input.productId);
    const size = String(action.input.size ?? '');
    const line = cartItems.find(item => item.productId === productId && item.size === size);
    if (!line) return [false, 'That item is not in the cart (check the size).'];
    const quantity = Math.min(Math.max(Number(action.input.quantity) || 0, 0), 10);
    const name = line.product?.name ?? 'the item';
    if (quantity === 0) {
      removeFromCart(productId, size);
      return [true, `Removed ${name} from the cart.`];
    }
    updateQuantity(productId, quantity, size);
    return [true, `Set ${name} quantity to ${quantity}.`];
  }

  async function runUpdateWishlist(action: ChatAction): Promise<[boolean, string]> {
    try {
      const add = !!action.input.add;
      const product = await productApi.getById(action.input.productId);
      if (isInWishlist(product._id) === add) {
        return [true, `${product.name} is already ${add ? 'in' : 'not in'} the wishlist.`];
      }
      await toggleWishlist(product);
      return [
        true,
        `${add ? 'Added' : 'Removed'} ${product.name} ${add ? 'to' : 'from'} the wishlist.`,
      ];
    } catch (error) {
      return [false, `Could not update the wishlist: ${getErrorMessage(error)}`];
    }
  }
}
