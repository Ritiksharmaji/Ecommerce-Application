import type {CartItem} from '@/types/models';
import {ApiError, apiClient} from './client';

export interface CheckoutSessionInput {
  orderId: string;
  items: CartItem[];
  shipping: number;
  successUrl: string;
  cancelUrl: string;
}

export const paymentApi = {
  /** POST /api/payments/checkout-session — returns the Stripe Checkout URL. */
  async createCheckoutSession(input: CheckoutSessionInput): Promise<string> {
    const {data} = await apiClient.post<{url?: string; error?: string}>(
      '/api/payments/checkout-session',
      {
        items: input.items.map(item => ({
          product: {name: item.product.name, images: item.product.images},
          price: item.price,
          quantity: item.quantity,
        })),
        shipping: input.shipping,
        orderId: input.orderId,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
    );
    if (!data.url) {
      throw new ApiError(data.error || 'Could not start payment');
    }
    return data.url;
  },
};
