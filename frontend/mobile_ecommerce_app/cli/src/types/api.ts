/** Envelope used by every expressJs_ecommerce_backend response. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: import('./models').User;
}

/** Fields sent when creating or updating a product (multipart form). */
export interface ProductInput {
  name: string;
  description: string;
  price: string;
  comparePrice?: string;
  stock: string;
  category: string;
  sizes: string[];
  isFeatured: boolean;
}
