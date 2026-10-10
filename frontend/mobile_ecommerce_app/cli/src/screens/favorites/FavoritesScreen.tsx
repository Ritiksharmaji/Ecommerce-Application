import React from 'react';
import {FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppHeader from '@/components/common/AppHeader';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import ProductCard from '@/components/product/ProductCard';
import {useWishlist} from '@/context/WishlistContext';
import type {MainTabScreenProps} from '@/navigation/types';

export default function FavoritesScreen({navigation}: MainTabScreenProps<'Favorites'>) {
  const {wishlist, loading} = useWishlist();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader title="Wishlist" showMenu showCart />

      {loading && wishlist.length === 0 ? (
        <LoadingView className="bg-surface" />
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={item => item._id}
          numColumns={2}
          contentContainerClassName="flex-grow px-4 pt-4"
          columnWrapperClassName="justify-between"
          renderItem={({item}) => <ProductCard product={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="Your wishlist is empty"
              message="Tap the heart on a product to save it here."
              actionLabel="Start Shopping"
              onAction={() => navigation.navigate('Home')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
