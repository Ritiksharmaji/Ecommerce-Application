import type {ApiResponse} from '@/types/api';
import type {Address, ShippingAddress} from '@/types/models';
import {apiClient} from './client';

export const addressApi = {
  /** GET /api/addresses — default address first. */
  async getAll(): Promise<Address[]> {
    const {data} = await apiClient.get<ApiResponse<Address[]>>('/api/addresses');
    return data.data ?? [];
  },

  /** POST /api/addresses */
  async create(
    address: ShippingAddress & Partial<Pick<Address, 'type' | 'isDefault'>>,
  ): Promise<Address> {
    const {data} = await apiClient.post<ApiResponse<Address>>('/api/addresses', address);
    return data.data;
  },

  /** DELETE /api/addresses/:id */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/addresses/${id}`);
  },
};
