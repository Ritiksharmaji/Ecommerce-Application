import React, {useCallback, useMemo, useRef} from 'react';
import {Alert, FlatList, Image, RefreshControl, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {useFocusEffect} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import {Ionicons} from '@/components/icons';
import {useAsync} from '@/hooks/useAsync';
import type {AdminProductsScreenProps} from '@/navigation/types';
import {productApi} from '@/services/api';
import {colors} from '@/theme';
import type {Product} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';
import {formatPrice} from '@/utils/format';
import {latestProducts} from '@/utils/productFilters';

interface RowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

function AdminProductRow({product, onEdit, onDelete}: RowProps) {
  return (
    <View className="mb-3 flex-row items-center rounded-lg border border-border bg-background p-3">
      <View className="mr-3 h-16 w-16 overflow-hidden rounded-lg bg-surface">
        {!!product.images[0] && (
          <Image source={{uri: product.images[0]}} className="h-full w-full" resizeMode="cover" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-primary" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="mb-1 text-xs text-secondary" numberOfLines={1}>
          {product.category || 'Other'} · Stock: {product.stock}
        </Text>
        {product.sizes.length > 0 && (
          <Text className="mb-1 text-xs text-secondary" numberOfLines={1}>
            Sizes: {product.sizes.join(', ')}
          </Text>
        )}
        <Text className="font-bold text-primary">{formatPrice(product.price)}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onEdit}
          className="rounded-full bg-surface p-2"
          accessibilityLabel="Edit">
          <Ionicons name="create-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="rounded-full bg-surface p-2"
          accessibilityLabel="Delete">
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminProductsScreen({
  navigation,
}: AdminProductsScreenProps<'ProductsList'>) {
  const {data, setData, loading, refreshing, reload} = useAsync(productApi.getAll);
  const products = useMemo(() => latestProducts(data ?? [], Infinity), [data]);

  // Re-fetch when returning from Add / Edit (skip the first focus: useAsync already loaded).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  const deleteProduct = (product: Product) =>
    Alert.alert('Delete product', `Delete "${product.name}"? This cannot be undone.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await productApi.remove(product._id);
            setData(prev => (prev ?? []).filter(p => p._id !== product._id));
            Toast.show({type: 'success', text1: 'Product removed'});
          } catch (error) {
            Toast.show({type: 'error', text1: 'Delete failed', text2: getErrorMessage(error)});
          }
        },
      },
    ]);

  if (loading) {
    return <LoadingView className="bg-surface" />;
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between border-b border-border bg-background p-4">
        <Text className="text-lg font-semibold text-primary">Products ({products.length})</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddProduct')}
          className="flex-row items-center rounded-full bg-gray-800 px-4 py-2">
          <Ionicons name="add" size={20} color="#fff" />
          <Text className="ml-1 font-medium text-white">Add Product</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item._id}
        contentContainerClassName="flex-grow p-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
        renderItem={({item}) => (
          <AdminProductRow
            product={item}
            onEdit={() => navigation.navigate('EditProduct', {productId: item._id})}
            onDelete={() => deleteProduct(item)}
          />
        )}
        ListEmptyComponent={<EmptyState icon="cube-outline" title="No products yet" />}
      />
    </View>
  );
}
