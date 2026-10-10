import React from 'react';
import {Image, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import {useCart} from '@/context/CartContext';
import {useAppNavigation} from '@/navigation/hooks';
import {colors} from '@/theme';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  showCart?: boolean;
}

export default function AppHeader({
  title,
  showBack,
  showMenu,
  showLogo,
  showSearch,
  showCart,
}: AppHeaderProps) {
  const navigation = useAppNavigation();
  const {itemCount} = useCart();

  const goBack = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs');
  const openShop = () => navigation.navigate('Shop');

  return (
    <View className="flex-row items-center justify-between bg-background px-4 py-3">
      <View className="flex-1 flex-row items-center">
        {showBack && (
          <TouchableOpacity onPress={goBack} className="mr-3" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        {showMenu && (
          <TouchableOpacity onPress={openShop} className="mr-3" accessibilityLabel="Browse shop">
            <Ionicons name="menu-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
        {showLogo ? (
          <Image
            source={require('@/assets/images/logo.png')}
            className="h-6 flex-1"
            resizeMode="contain"
          />
        ) : (
          !!title && (
            <Text
              className={`flex-1 text-center text-xl font-bold text-primary ${
                showBack ? 'mr-8' : ''
              }`}>
              {title}
            </Text>
          )
        )}
      </View>

      <View className="flex-row items-center gap-4">
        {showSearch && (
          <TouchableOpacity onPress={openShop} accessibilityLabel="Search products">
            <Ionicons name="search-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        {showCart && (
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', {screen: 'Cart'})}
            accessibilityLabel={`Cart, ${itemCount} items`}>
            <Ionicons name="bag-outline" size={24} color={colors.primary} />
            {itemCount > 0 && (
              <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-accent">
                <Text className="text-[10px] font-bold text-white">{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
