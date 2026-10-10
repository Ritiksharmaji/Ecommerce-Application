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
import {STORAGE_KEYS} from '@/constants/storageKeys';
import {useAuth} from '@/context/AuthContext';
import {productApi, wishlistApi} from '@/services/api';
import {secureStorage} from '@/services/storage/secureStorage';
import type {Product} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';

interface WishlistContextValue {
  wishlist: Product[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * Signed in: the wishlist lives on the server. Guest: product ids are kept on the device and moved
 * to the account after sign-in.
 */
export function WishlistProvider({children}: {children: ReactNode}) {
  const {token, isLoaded} = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const wishlistRef = useRef<Product[]>([]);
  wishlistRef.current = wishlist;

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const guestIds = (await secureStorage.getJSON<string[]>(STORAGE_KEYS.guestWishlist)) ?? [];
      if (token) {
        let products = await wishlistApi.get();
        const toAdd = guestIds.filter(id => !products.some(p => p._id === id));
        for (const productId of toAdd) {
          products = await wishlistApi.toggle(productId).catch(() => products);
        }
        if (guestIds.length) {
          await secureStorage.removeItem(STORAGE_KEYS.guestWishlist);
        }
        setWishlist(products);
      } else if (guestIds.length) {
        const ids = new Set(guestIds);
        setWishlist((await productApi.getAll()).filter(p => ids.has(p._id)));
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.warn('Could not load wishlist', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLoaded) {
      loadWishlist();
    }
  }, [isLoaded, loadWishlist]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      const previous = wishlistRef.current;
      const exists = previous.some(p => p._id === product._id);
      const next = exists ? previous.filter(p => p._id !== product._id) : [...previous, product];
      setWishlist(next);

      if (!token) {
        await secureStorage
          .setJSON(
            STORAGE_KEYS.guestWishlist,
            next.map(p => p._id),
          )
          .catch(() => undefined);
        return;
      }
      try {
        setWishlist(await wishlistApi.toggle(product._id));
      } catch (error) {
        setWishlist(previous);
        Toast.show({type: 'error', text1: 'Wishlist update failed', text2: getErrorMessage(error)});
      }
    },
    [token],
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some(p => p._id === productId),
    [wishlist],
  );

  const value = useMemo(
    () => ({wishlist, loading, isInWishlist, toggleWishlist}),
    [wishlist, loading, isInWishlist, toggleWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}
