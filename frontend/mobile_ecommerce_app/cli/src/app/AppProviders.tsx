import React, {ReactNode} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from '@/context/AuthContext';
import {CartProvider} from '@/context/CartContext';
import {ChatProvider} from '@/context/ChatContext';
import {WishlistProvider} from '@/context/WishlistContext';

/** Global providers. Order matters: cart, wishlist and chat read the auth token. */
export default function AppProviders({children}: {children: ReactNode}) {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ChatProvider>{children}</ChatProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
