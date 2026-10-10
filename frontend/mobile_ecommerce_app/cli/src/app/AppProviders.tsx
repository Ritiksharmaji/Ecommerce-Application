import React, {ReactNode} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from '@/context/AuthContext';
import {CartProvider} from '@/context/CartContext';
import {WishlistProvider} from '@/context/WishlistContext';

/** Global providers. Order matters: cart and wishlist read the auth token. */
export default function AppProviders({children}: {children: ReactNode}) {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
