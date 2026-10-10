import React, {memo} from 'react';
import {Image, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import {useWishlist} from '@/context/WishlistContext';
import {useAppNavigation} from '@/navigation/hooks';
import {colors} from '@/theme';
import type {Product} from '@/types/models';
import {formatPrice} from '@/utils/format';

function ProductCard({product}: {product: Product}) {
  const navigation = useAppNavigation();
  const {toggleWishlist, isInWishlist} = useWishlist();
  const liked = isInWishlist(product._id);

  return (
    <TouchableOpacity
      onPress={() => navigation.push('ProductDetails', {productId: product._id})}
      className="mb-4 w-[48%] overflow-hidden rounded-2xl bg-background shadow-sm"
      accessibilityLabel={product.name}>
      <View className="h-52 w-full bg-surface">
        {!!product.images[0] && (
          <Image source={{uri: product.images[0]}} className="h-full w-full" resizeMode="cover" />
        )}
        <TouchableOpacity
          onPress={() => toggleWishlist(product)}
          className="absolute right-2.5 top-2.5 rounded-full bg-background p-2"
          accessibilityLabel={liked ? 'Remove from favorites' : 'Add to favorites'}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? colors.accent : colors.primary}
          />
        </TouchableOpacity>
        {product.isFeatured && (
          <View className="absolute left-2.5 top-2.5 rounded-md bg-primary px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-white">FEATURED</Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <View className="mb-1 flex-row items-center">
          <Ionicons name="star" size={14} color={colors.star} />
          <Text className="ml-1 text-xs text-secondary">
            {product.ratings.average ? product.ratings.average.toFixed(1) : 'New'}
          </Text>
        </View>
        <Text numberOfLines={2} className="mb-1.5 text-sm font-semibold text-primary">
          {product.name}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-base font-bold text-primary">{formatPrice(product.price)}</Text>
          {product.comparePrice != null && product.comparePrice > product.price && (
            <Text className="ml-1.5 text-xs text-muted line-through">
              {formatPrice(product.comparePrice)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ProductCard);
