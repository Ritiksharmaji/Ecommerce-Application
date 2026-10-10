import type {ApiResponse} from '@/types/api';
import type {CartItem} from '@/types/models';
import {normalizeProduct} from '@/utils/normalize';
import {apiClient} from './client';

interface ServerCart {
  items?: {product: unknown; quantity: number; price: number; size?: string}[];
}

/** Server cart -> CartItem[]; lines whose product was deleted are dropped. */
const toCartItems = (cart: ServerCart | null | undefined): CartItem[] =>
  (cart?.items ?? [])
    .filter(item => item.product)
    .map(item => {
      const product = normalizeProduct(item.product);
      return {
        productId: product._id,
        product,
        quantity: item.quantity,
        size: item.size ?? '',
        price: item.price,
      };
    });

export const cartApi = {
  /** GET /api/cart */
  async get(): Promise<CartItem[]> {
    const {data} = await apiClient.get<ApiResponse<ServerCart>>('/api/cart');
    return toCartItems(data.data);
  },

  /** POST /api/cart/add */
  async add(productId: string, quantity: number, size: string): Promise<CartItem[]> {
    const {data} = await apiClient.post<ApiResponse<ServerCart>>('/api/cart/add', {
      productId,
      quantity,
      size,
    });
    return toCartItems(data.data);
  },

  /** PUT /api/cart/item/:productId */
  async updateQuantity(productId: string, quantity: number, size: string): Promise<CartItem[]> {
    const {data} = await apiClient.put<ApiResponse<ServerCart>>(`/api/cart/item/${productId}`, {
      quantity,
      size,
    });
    return toCartItems(data.data);
  },

  /** DELETE /api/cart/item/:productId?size= */
  async removeItem(productId: string, size: string): Promise<CartItem[]> {
    const {data} = await apiClient.delete<ApiResponse<ServerCart>>(`/api/cart/item/${productId}`, {
      params: {size},
    });
    return toCartItems(data.data);
  },

  /** DELETE /api/cart */
  async clear(): Promise<void> {
    await apiClient.delete('/api/cart');
  },
};
