/** Currency symbol shown in prices. */
export const CURRENCY = '$';

/** Must match the flat shippingCost in expressJs_ecommerce_backend controllers/ordersController.ts. */
export const DELIVERY_FEE = 2;

/** Products shown per "page" in the shop list (client-side paging). */
export const SHOP_PAGE_SIZE = 10;

/** Maximum product images per upload (backend: multer array limit). */
export const MAX_PRODUCT_IMAGES = 5;

/** Flat delivery fee for a non-empty cart (matches the backend order calculation). */
export const shippingFor = (subtotal: number): number => (subtotal > 0 ? DELIVERY_FEE : 0);
