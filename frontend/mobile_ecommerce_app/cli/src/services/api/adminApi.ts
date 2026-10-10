import type {ApiResponse} from '@/types/api';
import type {AdminStats} from '@/types/models';
import {normalizeOrders} from '@/utils/normalize';
import {apiClient} from './client';

export const adminApi = {
  /** GET /api/admin/stats */
  async getStats(): Promise<AdminStats> {
    const {data} = await apiClient.get<ApiResponse<AdminStats>>('/api/admin/stats');
    return {...data.data, recentOrders: normalizeOrders(data.data?.recentOrders)};
  },
};
