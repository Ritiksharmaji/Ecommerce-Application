import React, {useMemo, useState} from 'react';
import {FlatList, RefreshControl, TouchableOpacity, View} from 'react-native';
import {TextInput} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppHeader from '@/components/common/AppHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import {Ionicons} from '@/components/icons';
import ProductCard from '@/components/product/ProductCard';
import {SHOP_PAGE_SIZE} from '@/constants/app';
import {useProducts} from '@/hooks/useProducts';
import type {RootStackScreenProps} from '@/navigation/types';
import {colors} from '@/theme';
import {DEFAULT_FILTERS, filterProducts, type ProductFilters} from '@/utils/productFilters';
import ShopFilterModal from './components/ShopFilterModal';

export default function ShopScreen({route}: RootStackScreenProps<'Shop'>) {
  const {products, loading, refreshing, refresh} = useProducts();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    category: route.params?.category ?? '',
  });
  const [visibleCount, setVisibleCount] = useState(SHOP_PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);
  const visible = filtered.slice(0, visibleCount);

  const applyFilters = (next: ProductFilters) => {
    setFilters(next);
    setVisibleCount(SHOP_PAGE_SIZE);
    setShowFilters(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader title="Shop" showBack showCart />

      <View className="mx-4 my-2 flex-row gap-2">
        <View className="flex-1 flex-row items-center rounded-xl border border-border bg-background pl-4">
          <Ionicons name="search" size={20} color={colors.secondary} />
          <TextInput
            className="flex-1 px-3 py-3 text-primary"
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => applyFilters({...filters, search: searchText})}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-xl bg-gray-800"
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingView className="bg-surface" />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => item._id}
          numColumns={2}
          contentContainerClassName="p-4 pb-24"
          columnWrapperClassName="justify-between"
          renderItem={({item}) => <ProductCard product={item} />}
          onEndReached={() =>
            visible.length < filtered.length && setVisibleCount(n => n + SHOP_PAGE_SIZE)
          }
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No products found"
              message="Try a different search or filter."
            />
          }
        />
      )}

      <ShopFilterModal
        visible={showFilters}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}
