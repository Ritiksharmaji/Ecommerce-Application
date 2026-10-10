import type {ApiResponse, ProductInput} from '@/types/api';
import type {Product} from '@/types/models';
import {normalizeProduct, normalizeProducts} from '@/utils/normalize';
import {apiClient, imageFilePart} from './client';

const toFormData = (input: ProductInput, newImages: string[], existingImages?: string[]) => {
  const form = new FormData();
  form.append('name', input.name);
  form.append('description', input.description);
  form.append('price', input.price);
  if (input.comparePrice) {
    form.append('comparePrice', input.comparePrice);
  }
  form.append('stock', input.stock);
  form.append('category', input.category);
  form.append('isFeatured', String(input.isFeatured));
  form.append('sizes', JSON.stringify(input.sizes));
  existingImages?.forEach(url => form.append('existingImages', url));
  // Uploaded to Cloudinary by the backend (field `images`, max 5 files).
  newImages.forEach((uri, i) => form.append('images', imageFilePart(uri, i)));
  return form;
};

const multipart = {headers: {'Content-Type': 'multipart/form-data'}};

export const productApi = {
  /** GET /api/products — the catalogue is small, so one large page holds all of it. */
  async getAll(): Promise<Product[]> {
    const {data} = await apiClient.get<ApiResponse<unknown[]>>('/api/products', {
      params: {page: 1, limit: 1000},
    });
    return data.success ? normalizeProducts(data.data) : [];
  },

  /** GET /api/products/:id */
  async getById(id: string): Promise<Product> {
    const {data} = await apiClient.get<ApiResponse<unknown>>(`/api/products/${id}`);
    return normalizeProduct(data.data);
  },

  /** POST /api/products (admin, multipart) */
  async create(input: ProductInput, images: string[]): Promise<Product> {
    const {data} = await apiClient.post<ApiResponse<unknown>>(
      '/api/products',
      toFormData(input, images),
      multipart,
    );
    return normalizeProduct(data.data);
  },

  /** PUT /api/products/:id (admin, multipart). Kept image URLs go in `existingImages`. */
  async update(
    id: string,
    input: ProductInput,
    existingImages: string[],
    newImages: string[],
  ): Promise<Product> {
    const {data} = await apiClient.put<ApiResponse<unknown>>(
      `/api/products/${id}`,
      toFormData(input, newImages, existingImages),
      multipart,
    );
    return normalizeProduct(data.data);
  },

  /** DELETE /api/products/:id (admin) */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },
};
