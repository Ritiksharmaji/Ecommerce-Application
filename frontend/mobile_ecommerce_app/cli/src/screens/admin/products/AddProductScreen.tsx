import React, {useState} from 'react';
import Toast from 'react-native-toast-message';
import type {AdminProductsScreenProps} from '@/navigation/types';
import {productApi} from '@/services/api';
import {getErrorMessage} from '@/utils/errors';
import ProductForm, {type ProductFormValues} from './components/ProductForm';

export default function AddProductScreen({navigation}: AdminProductsScreenProps<'AddProduct'>) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async ({input, newImages}: ProductFormValues) => {
    setSubmitting(true);
    try {
      await productApi.create(input, newImages);
      Toast.show({type: 'success', text1: 'Product added'});
      navigation.goBack();
    } catch (error) {
      Toast.show({type: 'error', text1: 'Add failed', text2: getErrorMessage(error)});
      setSubmitting(false);
    }
  };

  return (
    <ProductForm submitLabel="Create Product" submitting={submitting} onSubmit={handleSubmit} />
  );
}
