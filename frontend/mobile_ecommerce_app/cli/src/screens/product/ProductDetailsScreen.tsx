import React, {useEffect, useState} from 'react';
import {Image, ScrollView, TouchableOpacity, useWindowDimensions, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import {Ionicons} from '@/components/icons';
import {useCart} from '@/context/CartContext';
import {useWishlist} from '@/context/WishlistContext';
import type {RootStackScreenProps} from '@/navigation/types';
import {productApi} from '@/services/api';
import {colors} from '@/theme';
import type {Product} from '@/types/models';
import {formatPrice} from '@/utils/format';

const IMAGE_HEIGHT = 450;

export default function ProductDetailsScreen({
  route,
  navigation,
}: RootStackScreenProps<'ProductDetails'>) {
  const {productId} = route.params;
  const {width} = useWindowDimensions();
  const {addToCart, itemCount} = useCart();
  const {toggleWishlist, isInWishlist} = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    productApi
      .getById(productId)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <LoadingView />;
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          icon="alert-circle-outline"
          title="Product not found"
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const liked = isInWishlist(product._id);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      Toast.show({type: 'info', text1: 'No size selected', text2: 'Please select a size'});
      return;
    }
    addToCart(product, selectedSize ?? '');
    Toast.show({type: 'success', text1: 'Added to cart', text2: product.name});
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="pb-28">
        <View className="mb-6 bg-surface" style={{height: IMAGE_HEIGHT}}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={e => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {product.images.map(uri => (
              <Image
                key={uri}
                source={{uri}}
                style={{width, height: IMAGE_HEIGHT}}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {product.images.map((uri, index) => (
              <View
                key={uri}
                className={`h-2 rounded-full ${
                  index === activeImage ? 'w-4 bg-primary' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </View>
        </View>

        <View className="px-5">
          <View className="mb-2 flex-row items-start justify-between">
            <Text className="mr-4 flex-1 text-2xl font-bold text-primary">{product.name}</Text>
            {product.ratings.count > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color={colors.star} />
                <Text className="ml-1 text-sm font-bold text-primary">
                  {product.ratings.average.toFixed(1)}
                </Text>
                <Text className="ml-1 text-xs text-secondary">({product.ratings.count})</Text>
              </View>
            )}
          </View>

          <View className="mb-4 flex-row items-center">
            <Text className="text-2xl font-bold text-primary">{formatPrice(product.price)}</Text>
            {product.comparePrice != null && product.comparePrice > product.price && (
              <Text className="ml-2 text-base text-muted line-through">
                {formatPrice(product.comparePrice)}
              </Text>
            )}
          </View>

          {product.sizes.length > 0 && (
            <>
              <Text className="mb-3 text-base font-bold text-primary">Size</Text>
              <View className="mb-6 flex-row flex-wrap gap-3">
                {product.sizes.map(size => {
                  const selected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      accessibilityState={{selected}}
                      className={`h-12 min-w-12 items-center justify-center rounded-full border px-3 ${
                        selected ? 'border-primary bg-primary' : 'border-gray-300 bg-background'
                      }`}>
                      <Text className={`font-medium ${selected ? 'text-white' : 'text-primary'}`}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text className="mb-2 text-base font-bold text-primary">Description</Text>
          <Text className="mb-6 leading-6 text-secondary">{product.description}</Text>
        </View>
      </ScrollView>

      {/* Floating back / wishlist buttons over the image */}
      <SafeAreaView edges={['top']} className="absolute left-4 right-4 top-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/80"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleWishlist(product)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/80"
            accessibilityLabel={liked ? 'Remove from favorites' : 'Add to favorites'}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={24}
              color={liked ? colors.accent : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SafeAreaView
        edges={['bottom']}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-background">
        <View className="flex-row items-center p-4">
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={outOfStock}
            className={`flex-1 flex-row items-center justify-center rounded-full py-4 ${
              outOfStock ? 'bg-gray-300' : 'bg-primary'
            }`}>
            <Ionicons name="bag-outline" size={20} color="#fff" />
            <Text className="ml-2 text-base font-bold text-white">
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', {screen: 'Cart'})}
            className="ml-4 p-2"
            accessibilityLabel={`Cart, ${itemCount} items`}>
            <Ionicons name="cart-outline" size={26} color={colors.primary} />
            {itemCount > 0 && (
              <View className="absolute right-0 top-0 h-4 w-4 items-center justify-center rounded-full bg-primary">
                <Text className="text-[9px] text-white">{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
