import React, {useState} from 'react';
import Toast from 'react-native-toast-message';
import EmptyState from '@/components/common/EmptyState';
import LoadingView from '@/components/common/LoadingView';
import {useAsync} from '@/hooks/useAsync';
import type {AdminProductsScreenProps} from '@/navigation/types';
import {productApi} from '@/services/api';
import {getErrorMessage} from '@/utils/errors';
import ProductForm, {type ProductFormValues} from './components/ProductForm';

export default function EditProductScreen({
  route,
  navigation,
}: AdminProductsScreenProps<'EditProduct'>) {
  const {productId} = route.params;
  const {data: product, loading} = useAsync(() => productApi.getById(productId), [productId]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async ({input, existingImages, newImages}: ProductFormValues) => {
    setSubmitting(true);
    try {
      await productApi.update(productId, input, existingImages, newImages);
      Toast.show({type: 'success', text1: 'Product updated'});
      navigation.goBack();
    } catch (error) {
      Toast.show({type: 'error', text1: 'Update failed', text2: getErrorMessage(error)});
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingView className="bg-surface" />;
  }
  if (!product) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Product not found"
        actionLabel="Go back"
        onAction={() => navigation.goBack()}
      />
    );
  }
  return (
    <ProductForm
      initial={product}
      submitLabel="Save Changes"
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}
