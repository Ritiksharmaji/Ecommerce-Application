import type {ApiResponse} from '@/types/api';
import type {Product} from '@/types/models';
import {normalizeProducts} from '@/utils/normalize';
import {apiClient} from './client';

export const wishlistApi = {
  /** GET /api/wishlist */
  async get(): Promise<Product[]> {
    const {data} = await apiClient.get<ApiResponse<unknown[]>>('/api/wishlist');
    return normalizeProducts(data.data);
  },

  /** POST /api/wishlist/toggle — returns the updated wishlist. */
  async toggle(productId: string): Promise<Product[]> {
    const {data} = await apiClient.post<ApiResponse<unknown[]>>('/api/wishlist/toggle', {
      productId,
    });
    return normalizeProducts(data.data);
  },
};
