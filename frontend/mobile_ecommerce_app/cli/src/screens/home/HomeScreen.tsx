import React, {useMemo} from 'react';
import {ActivityIndicator, RefreshControl, ScrollView, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {BANNERS} from '@/assets/data/banners';
import AppHeader from '@/components/common/AppHeader';
import PrimaryButton from '@/components/common/PrimaryButton';
import SectionHeader from '@/components/common/SectionHeader';
import CategoryItem from '@/components/product/CategoryItem';
import ProductCard from '@/components/product/ProductCard';
import {ALL_CATEGORY, CATEGORIES} from '@/constants/categories';
import {useProducts} from '@/hooks/useProducts';
import type {MainTabScreenProps} from '@/navigation/types';
import {colors} from '@/theme';
import type {Product} from '@/types/models';
import {latestProducts} from '@/utils/productFilters';
import BannerCarousel from './components/BannerCarousel';

const LATEST_COUNT = 10;
const BEST_SELLER_COUNT = 6;

function ProductGrid({products}: {products: Product[]}) {
  return (
    <View className="flex-row flex-wrap justify-between">
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </View>
  );
}

export default function HomeScreen({navigation}: MainTabScreenProps<'Home'>) {
  const {products, loading, refreshing, error, refresh} = useProducts();

  const latest = useMemo(() => latestProducts(products, LATEST_COUNT), [products]);
  const bestSellers = useMemo(
    () => products.filter(p => p.isFeatured).slice(0, BEST_SELLER_COUNT),
    [products],
  );

  const openShop = (category?: string) => navigation.navigate('Shop', {category});

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader showMenu showLogo showCart />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <BannerCarousel banners={BANNERS} onPressBanner={() => openShop()} />

        <View className="mt-6">
          <SectionHeader title="Categories" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[ALL_CATEGORY, ...CATEGORIES].map(category => (
              <CategoryItem
                key={category.id}
                item={category}
                isSelected={false}
                onPress={() => openShop(category === ALL_CATEGORY ? undefined : category.name)}
              />
            ))}
          </ScrollView>
        </View>

        <View className="mt-8">
          <SectionHeader
            title="Latest Collection"
            actionLabel="See All"
            onAction={() => openShop()}
          />
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} className="mt-5" />
          ) : latest.length ? (
            <ProductGrid products={latest} />
          ) : (
            <Text className="mt-5 text-center text-secondary">{error ?? 'No products found'}</Text>
          )}
        </View>

        {bestSellers.length > 0 && (
          <View className="mt-4">
            <SectionHeader title="Best Seller" />
            <ProductGrid products={bestSellers} />
          </View>
        )}

        <View className="mt-4 items-center rounded-2xl bg-surface p-6">
          <Text className="mb-2 text-center text-2xl font-bold text-primary">
            Join the Revolution
          </Text>
          <Text className="mb-4 text-center text-secondary">
            Subscribe to our newsletter and get 10% off your first purchase.
          </Text>
          <PrimaryButton
            title="Subscribe Now"
            rounded
            className="w-full"
            onPress={() =>
              Toast.show({
                type: 'success',
                text1: 'Subscribed!',
                text2: 'Thanks for joining our newsletter.',
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
