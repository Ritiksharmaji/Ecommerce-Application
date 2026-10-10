import type {ApiResponse} from '@/types/api';
import type {Order, OrderStatus, PaymentMethod, ShippingAddress} from '@/types/models';
import {normalizeOrder, normalizeOrders} from '@/utils/normalize';
import {apiClient} from './client';

export interface CreateOrderInput {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export const orderApi = {
  /** GET /api/orders — the signed-in user's orders. */
  async getMine(): Promise<Order[]> {
    const {data} = await apiClient.get<ApiResponse<unknown[]>>('/api/orders');
    return normalizeOrders(data.data);
  },

  /** GET /api/orders/:id */
  async getById(id: string): Promise<Order> {
    const {data} = await apiClient.get<ApiResponse<unknown>>(`/api/orders/${id}`);
    return normalizeOrder(data.data);
  },

  /** POST /api/orders — built from the server cart. */
  async create(input: CreateOrderInput): Promise<Order> {
    const {data} = await apiClient.post<ApiResponse<unknown>>('/api/orders', input);
    return normalizeOrder(data.data);
  },

  /** GET /api/orders/admin/all (admin) */
  async getAll(): Promise<Order[]> {
    const {data} = await apiClient.get<ApiResponse<unknown[]>>('/api/orders/admin/all', {
      params: {page: 1, limit: 100},
    });
    return normalizeOrders(data.data);
  },

  /** PUT /api/orders/:id/status (admin) */
  async updateStatus(id: string, orderStatus: OrderStatus): Promise<Order> {
    const {data} = await apiClient.put<ApiResponse<unknown>>(`/api/orders/${id}/status`, {
      orderStatus,
    });
    return normalizeOrder(data.data);
  },
};
