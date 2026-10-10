/** Domain models returned by expressJs_ecommerce_backend. */

export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  sizes: string[];
  category: string;
  stock: number;
  ratings: {average: number; count: number};
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  size: string;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Address extends ShippingAddress {
  _id: string;
  type: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
  createdAt: string;
}

export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'stripe';

export interface OrderItem {
  _id: string;
  /** Populated product (name/images), or a placeholder when the product was deleted. */
  product: Pick<Product, 'images'> & Partial<Pick<Product, '_id' | 'name'>>;
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface Order {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email'> | string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
}
