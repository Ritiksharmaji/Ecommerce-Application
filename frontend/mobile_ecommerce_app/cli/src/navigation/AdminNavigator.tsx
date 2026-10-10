import React from 'react';
import {TouchableOpacity} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons, type IconName} from '@/components/icons';
import {useAuth} from '@/context/AuthContext';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminLoginScreen from '@/screens/admin/AdminLoginScreen';
import AdminOrdersScreen from '@/screens/admin/AdminOrdersScreen';
import {colors} from '@/theme';
import AdminProductsNavigator from './AdminProductsNavigator';
import {useAppNavigation} from './hooks';
import {headerScreenOptions} from './navigationTheme';
import type {AdminTabParamList} from './types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const tabIcon =
  (name: IconName) =>
  ({color, size}: {color: string; size: number}) =>
    <Ionicons name={name} size={size} color={color} />;

function ExitButton() {
  const navigation = useAppNavigation();
  const exit = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs');
  return (
    <TouchableOpacity
      onPress={exit}
      className="mr-4 flex-row items-center"
      accessibilityRole="button">
      <Ionicons name="log-out-outline" size={24} color={colors.primary} />
      <Text className="ml-1 font-medium text-primary">Exit</Text>
    </TouchableOpacity>
  );
}

/** Admin panel (Dashboard / Products / Orders), shown only to users with the admin role. */
export default function AdminNavigator() {
  const {isAdmin} = useAuth();

  if (!isAdmin) {
    return <AdminLoginScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        ...headerScreenOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerRight: ExitButton,
      }}>
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{title: 'Dashboard', tabBarIcon: tabIcon('grid-outline')}}
      />
      <Tab.Screen
        name="AdminProducts"
        component={AdminProductsNavigator}
        options={{title: 'Products', tabBarIcon: tabIcon('cube-outline')}}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{title: 'Orders', tabBarIcon: tabIcon('receipt-outline')}}
      />
    </Tab.Navigator>
  );
}
