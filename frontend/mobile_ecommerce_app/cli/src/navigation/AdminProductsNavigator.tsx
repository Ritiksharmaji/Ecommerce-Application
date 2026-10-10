import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AddProductScreen from '@/screens/admin/products/AddProductScreen';
import AdminProductsScreen from '@/screens/admin/products/AdminProductsScreen';
import EditProductScreen from '@/screens/admin/products/EditProductScreen';
import {headerScreenOptions} from './navigationTheme';
import type {AdminProductsStackParamList} from './types';

const Stack = createNativeStackNavigator<AdminProductsStackParamList>();

export default function AdminProductsNavigator() {
  return (
    <Stack.Navigator screenOptions={headerScreenOptions}>
      <Stack.Screen
        name="ProductsList"
        component={AdminProductsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{title: 'Add Product'}}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{title: 'Edit Product'}}
      />
    </Stack.Navigator>
  );
}
