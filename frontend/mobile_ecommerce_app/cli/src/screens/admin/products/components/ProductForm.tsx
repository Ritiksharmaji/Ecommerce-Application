import React, {useState} from 'react';
import {Image, ScrollView, Switch, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {launchImageLibrary} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import FormField from '@/components/common/FormField';
import PrimaryButton from '@/components/common/PrimaryButton';
import {Ionicons} from '@/components/icons';
import {MAX_PRODUCT_IMAGES} from '@/constants/app';
import {CATEGORIES} from '@/constants/categories';
import {colors} from '@/theme';
import type {ProductInput} from '@/types/api';
import type {Product} from '@/types/models';
import {parseList} from '@/utils/format';

export interface ProductFormValues {
  input: ProductInput;
  /** Image URLs already on the server that are kept (edit only). */
  existingImages: string[];
  /** Local file URIs picked from the gallery. */
  newImages: string[];
}

interface ProductFormProps {
  initial?: Product;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ProductFormValues) => void;
}

/** Create / edit product form (admin). Validates required fields before calling `onSubmit`. */
export default function ProductForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
}: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [comparePrice, setComparePrice] = useState(
    initial?.comparePrice != null ? String(initial.comparePrice) : '',
  );
  const [stock, setStock] = useState(initial ? String(initial.stock) : '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].name);
  const [sizes, setSizes] = useState(initial?.sizes.join(', ') ?? '');
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images ?? []);
  const [newImages, setNewImages] = useState<string[]>([]);

  const remainingSlots = MAX_PRODUCT_IMAGES - existingImages.length - newImages.length;

  const pickImages = async () => {
    if (remainingSlots <= 0) {
      Toast.show({
        type: 'info',
        text1: `Max ${MAX_PRODUCT_IMAGES} images`,
        text2: 'Remove an image first',
      });
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remainingSlots,
      quality: 0.8,
    });
    if (result.errorCode) {
      Toast.show({
        type: 'error',
        text1: 'Could not open photos',
        text2: result.errorMessage ?? result.errorCode,
      });
      return;
    }
    const uris = (result.assets ?? []).map(a => a.uri).filter((uri): uri is string => !!uri);
    setNewImages(prev => [...prev, ...uris].slice(0, MAX_PRODUCT_IMAGES - existingImages.length));
  };

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !price || !stock) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }
    if (Number.isNaN(Number(price)) || Number.isNaN(Number(stock))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid number',
        text2: 'Price and stock must be numbers',
      });
      return;
    }
    if (existingImages.length + newImages.length === 0) {
      Toast.show({type: 'error', text1: 'Image required', text2: 'Add at least one image'});
      return;
    }
    onSubmit({
      input: {
        name: name.trim(),
        description: description.trim(),
        price,
        comparePrice: comparePrice || undefined,
        stock,
        category,
        sizes: parseList(sizes),
        isFeatured,
      },
      existingImages,
      newImages,
    });
  };

  const removeImage = (uri: string) => {
    setExistingImages(prev => prev.filter(u => u !== uri));
    setNewImages(prev => prev.filter(u => u !== uri));
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="p-4 pb-20"
      keyboardShouldPersistTaps="handled">
      <View className="rounded-xl bg-background p-4 shadow-sm">
        <FormField
          label="Product Name *"
          placeholder="e.g. Cotton T-Shirt"
          value={name}
          onChangeText={setName}
        />
        <View className="flex-row gap-3">
          <FormField
            label="Price ($) *"
            containerClassName="mb-4 flex-1"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <FormField
            label="Compare Price ($)"
            containerClassName="mb-4 flex-1"
            placeholder="Optional"
            keyboardType="decimal-pad"
            value={comparePrice}
            onChangeText={setComparePrice}
          />
        </View>
        <FormField
          label="Stock *"
          placeholder="e.g. 50"
          keyboardType="number-pad"
          value={stock}
          onChangeText={setStock}
        />

        <Text className="mb-1 text-xs font-bold uppercase text-secondary">Category</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {CATEGORIES.map(c => {
            const selected = category === c.name;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCategory(c.name)}
                accessibilityState={{selected}}
                className={`rounded-full border px-4 py-2 ${
                  selected ? 'border-primary bg-primary' : 'border-border bg-surface'
                }`}>
                <Text className={selected ? 'text-white' : 'text-primary'}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FormField
          label="Sizes (comma separated)"
          placeholder="e.g. S, M, L, XL"
          autoCapitalize="characters"
          value={sizes}
          onChangeText={setSizes}
        />

        <Text className="mb-1 text-xs font-bold uppercase text-secondary">
          Images ({existingImages.length + newImages.length}/{MAX_PRODUCT_IMAGES})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {[...existingImages, ...newImages].map(uri => (
            <View key={uri} className="mr-2">
              <Image source={{uri}} className="h-28 w-28 rounded-lg" />
              <TouchableOpacity
                onPress={() => removeImage(uri)}
                className="absolute right-1 top-1 rounded-full bg-white p-1"
                accessibilityLabel="Remove image">
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
          {remainingSlots > 0 && (
            <TouchableOpacity
              onPress={pickImages}
              className="h-28 w-28 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-surface">
              <Ionicons name="cloud-upload-outline" size={28} color={colors.secondary} />
              <Text className="mt-1 text-xs text-secondary">Add images</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <FormField
          label="Description *"
          multiline
          containerClassName="mb-6"
          value={description}
          onChangeText={setDescription}
        />

        <View className="mb-6 flex-row items-center justify-between">
          <Text className="font-bold text-primary">Featured Product</Text>
          <Switch
            value={isFeatured}
            onValueChange={setIsFeatured}
            trackColor={{false: colors.border, true: colors.primary}}
          />
        </View>

        <PrimaryButton title={submitLabel} loading={submitting} onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
}
