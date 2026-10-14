import React from 'react';
import {Image, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {useAppNavigation} from '@/navigation/hooks';
import type {ChatProduct} from '@/types/chat';
import {formatPrice} from '@/utils/format';

/** Horizontal product cards under an assistant reply; tap opens the product. */
export default function ChatProductCards({products}: {products: ChatProduct[]}) {
  const navigation = useAppNavigation();
  if (!products.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-2"
      contentContainerClassName="pr-4">
      {products.map(p => (
        <TouchableOpacity
          key={p.id}
          onPress={() => navigation.push('ProductDetails', {productId: p.id})}
          className="mr-3 w-36 overflow-hidden rounded-2xl border border-border bg-background"
          accessibilityLabel={`${p.name}, ${formatPrice(p.price)}`}>
          <View className="h-36 w-full bg-surface">
            {!!p.image && (
              <Image source={{uri: p.image}} className="h-full w-full" resizeMode="cover" />
            )}
          </View>
          <View className="p-2">
            <Text numberOfLines={2} className="text-xs font-semibold text-primary">
              {p.name}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Text className="text-sm font-bold text-primary">{formatPrice(p.price)}</Text>
              {!!p.comparePrice && p.comparePrice > p.price && (
                <Text className="ml-1 text-[10px] text-muted line-through">
                  {formatPrice(p.comparePrice)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
