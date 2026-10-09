import { Stack } from "expo-router";
import '../global.css';
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { toastConfig } from '@/components/toast/toastConfig';
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <>
              <Stack screenOptions={{ headerShown: false }} />
              <Toast config={toastConfig} />
            </>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
