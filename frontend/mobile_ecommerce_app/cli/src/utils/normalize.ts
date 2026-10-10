import type {Order, Product} from '@/types/models';

/**
 * Fills defaults for products from the API. Cart items only populate name/images/price/stock, and
 * products created by the previous web backend store images in `image`.
 */
export const normalizeProduct = (p: any): Product => ({
  _id: p?._id,
  name: p?.name ?? '',
  description: p?.description ?? '',
  price: Number(p?.price ?? 0),
  comparePrice: p?.comparePrice != null ? Number(p.comparePrice) : undefined,
  images:
    Array.isArray(p?.images) && p.images.length ? p.images : Array.isArray(p?.image) ? p.image : [],
  sizes: Array.isArray(p?.sizes) ? p.sizes : [],
  category: typeof p?.category === 'string' ? p.category : p?.category?.name ?? '',
  stock: typeof p?.stock === 'number' ? p.stock : 0,
  ratings: {
    average: Number(p?.ratings?.average ?? 0),
    count: Number(p?.ratings?.count ?? 0),
  },
  isFeatured: !!p?.isFeatured,
  isActive: p?.isActive ?? true,
  createdAt: p?.createdAt ?? new Date().toISOString(),
});

export const normalizeProducts = (list: unknown): Product[] =>
  Array.isArray(list) ? list.filter(Boolean).map(normalizeProduct) : [];

/** Order items reference a populated product, or null if it was deleted since. */
export const normalizeOrder = (o: any): Order => ({
  ...o,
  items: Array.isArray(o?.items)
    ? o.items.map((it: any) => ({...it, product: it?.product ?? {images: []}}))
    : [],
  subtotal: Number(o?.subtotal ?? 0),
  shippingCost: Number(o?.shippingCost ?? 0),
  tax: Number(o?.tax ?? 0),
  totalAmount: Number(o?.totalAmount ?? 0),
});

export const normalizeOrders = (list: unknown): Order[] =>
  Array.isArray(list) ? list.map(normalizeOrder) : [];
