import React from 'react';
import {View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Feather, Ionicons, type IconName} from '@/components/icons';
import {useCart} from '@/context/CartContext';
import CartScreen from '@/screens/cart/CartScreen';
import FavoritesScreen from '@/screens/favorites/FavoritesScreen';
import HomeScreen from '@/screens/home/HomeScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import {colors} from '@/theme';
import type {MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICON_SIZE = 26;

const tabIcon =
  (active: IconName, inactive: IconName) =>
  ({color, focused}: {color: string; focused: boolean}) =>
    <Ionicons name={focused ? active : inactive} size={ICON_SIZE} color={color} />;

function CartTabIcon({color}: {color: string}) {
  const {itemCount} = useCart();
  return (
    <View>
      <Feather name="shopping-cart" size={ICON_SIZE} color={color} />
      {itemCount > 0 && (
        <View className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
      )}
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {borderTopColor: colors.border, height: 56, paddingTop: 8},
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarIcon: tabIcon('home', 'home-outline'), tabBarAccessibilityLabel: 'Home'}}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{tabBarIcon: CartTabIcon, tabBarAccessibilityLabel: 'Cart'}}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: tabIcon('heart', 'heart-outline'),
          tabBarAccessibilityLabel: 'Favorites',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: tabIcon('person', 'person-outline'),
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
