import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoadingView from '@/components/common/LoadingView';
import {useAuth} from '@/context/AuthContext';
import SignInScreen from '@/screens/auth/SignInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import CheckoutScreen from '@/screens/checkout/CheckoutScreen';
import OrderDetailsScreen from '@/screens/orders/OrderDetailsScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import ProductDetailsScreen from '@/screens/product/ProductDetailsScreen';
import ShopScreen from '@/screens/shop/ShopScreen';
import AdminNavigator from './AdminNavigator';
import MainTabNavigator from './MainTabNavigator';
import {navigationTheme} from './navigationTheme';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const {isLoaded, isSignedIn} = useAuth();

  if (!isLoaded) {
    return <LoadingView />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Admin" component={AdminNavigator} />
        {/* Guest-only: removed after sign-in, which returns the user to the previous screen. */}
        {!isSignedIn && (
          <Stack.Group screenOptions={{animation: 'slide_from_bottom'}}>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
