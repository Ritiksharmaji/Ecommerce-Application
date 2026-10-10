import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Toast from 'react-native-toast-message';
import {useAuth} from '@/context/AuthContext';
import {cartApi} from '@/services/api';
import type {CartItem, Product} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';

interface CartContextValue {
  cartItems: CartItem[];
  cartTotal: number;
  itemCount: number;
  isLoading: boolean;
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, quantity: number, size: string) => void;
  clearCart: () => void;
  /** Resolves once pending server updates finish (call before placing an order). */
  flush: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const isSameLine = (item: CartItem, productId: string, size: string) =>
  item.productId === productId && item.size === size;

/**
 * Guests keep the cart in memory. Signed-in users get optimistic local updates that are synced to
 * the server one at a time, so the last response always reflects every change.
 */
export function CartProvider({children}: {children: ReactNode}) {
  const {token, isLoaded} = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = cartItems;
  const prevToken = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const refreshCart = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setCartItems(await cartApi.get());
    } catch (error) {
      console.warn('Could not load cart', error);
    }
  }, [token]);

  /** Runs a server update after the previous ones; on failure reloads the server cart. */
  const sync = useCallback(
    (request: () => Promise<CartItem[] | void>) => {
      if (!token) {
        return;
      }
      queue.current = queue.current
        .then(async () => {
          const items = await request();
          if (items) {
            setCartItems(items);
          }
        })
        .catch(async error => {
          Toast.show({type: 'error', text1: 'Cart update failed', text2: getErrorMessage(error)});
          await refreshCart();
        });
    },
    [token, refreshCart],
  );

  // Sign-in: move guest items to the server cart, then load it. Sign-out: empty the cart.
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const run = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const guestItems = prevToken.current ? [] : itemsRef.current;
          for (const item of guestItems) {
            await cartApi.add(item.productId, item.quantity, item.size).catch(() => undefined);
          }
          await refreshCart();
        } finally {
          setIsLoading(false);
        }
      } else if (prevToken.current) {
        setCartItems([]);
      }
      prevToken.current = token;
    };
    run();
  }, [isLoaded, token, refreshCart]);

  const removeFromCart = useCallback(
    (productId: string, size: string) => {
      setCartItems(prev => prev.filter(item => !isSameLine(item, productId, size)));
      sync(() => cartApi.removeItem(productId, size));
    },
    [sync],
  );

  const addToCart = useCallback(
    (product: Product, size: string) => {
      setCartItems(prev => {
        const existing = prev.find(item => isSameLine(item, product._id, size));
        if (existing) {
          return prev.map(item =>
            item === existing ? {...item, quantity: item.quantity + 1} : item,
          );
        }
        return [
          ...prev,
          {productId: product._id, product, quantity: 1, size, price: product.price},
        ];
      });
      sync(() => cartApi.add(product._id, 1, size));
    },
    [sync],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, size: string) => {
      if (quantity <= 0) {
        removeFromCart(productId, size);
        return;
      }
      setCartItems(prev =>
        prev.map(item => (isSameLine(item, productId, size) ? {...item, quantity} : item)),
      );
      sync(() => cartApi.updateQuantity(productId, quantity, size));
    },
    [sync, removeFromCart],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    sync(() => cartApi.clear());
  }, [sync]);

  const flush = useCallback(() => queue.current, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      cartTotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      isLoading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      flush,
      refreshCart,
    }),
    [
      cartItems,
      isLoading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      flush,
      refreshCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
