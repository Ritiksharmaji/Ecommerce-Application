import type {OrderStatus, PaymentStatus} from '@/types/models';

/** Must match the orderStatus enum in expressJs_ecommerce_backend models/Order.ts. */
export const ORDER_STATUSES: OrderStatus[] = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export interface BadgeStyle {
  container: string;
  text: string;
}

/** Badge colours (NativeWind classes) per order status. */
export const ORDER_STATUS_STYLES: Record<OrderStatus, BadgeStyle> = {
  placed: {container: 'bg-yellow-50', text: 'text-yellow-900'},
  processing: {container: 'bg-indigo-50', text: 'text-indigo-900'},
  shipped: {container: 'bg-purple-50', text: 'text-purple-900'},
  delivered: {container: 'bg-green-50', text: 'text-green-900'},
  cancelled: {container: 'bg-red-50', text: 'text-red-900'},
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, BadgeStyle> = {
  pending: {container: 'bg-orange-50', text: 'text-orange-600'},
  paid: {container: 'bg-green-50', text: 'text-green-700'},
  failed: {container: 'bg-red-50', text: 'text-red-700'},
  refunded: {container: 'bg-gray-100', text: 'text-gray-700'},
};

const FALLBACK: BadgeStyle = {container: 'bg-gray-100', text: 'text-gray-700'};

export const getOrderStatusStyle = (status: string): BadgeStyle =>
  ORDER_STATUS_STYLES[status as OrderStatus] ?? FALLBACK;

export const getPaymentStatusStyle = (status: string): BadgeStyle =>
  PAYMENT_STATUS_STYLES[status as PaymentStatus] ?? FALLBACK;
