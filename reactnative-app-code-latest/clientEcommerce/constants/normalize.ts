import type { Product, Order } from "@/constants/types";

/**
 * Maps a product from the ServerECommerce backend onto the Product shape the screens render.
 * The backend already uses this shape; this just fills defaults for partially populated
 * products (e.g. cart items populate only name/images/price/stock).
 */
export const normalizeProduct = (p: any): Product => ({
    _id: p?._id,
    name: p?.name ?? "",
    description: p?.description ?? "",
    price: Number(p?.price ?? 0),
    comparePrice: p?.comparePrice != null ? Number(p.comparePrice) : undefined,
    images: Array.isArray(p?.images) ? p.images : [],
    sizes: Array.isArray(p?.sizes) ? p.sizes : [],
    category: p?.category ?? "",
    stock: typeof p?.stock === "number" ? p.stock : 0,
    ratings: { average: Number(p?.ratings?.average ?? 0), count: Number(p?.ratings?.count ?? 0) },
    isFeatured: !!p?.isFeatured,
    isActive: p?.isActive ?? true,
    createdAt: p?.createdAt ?? new Date().toISOString(),
});

export const normalizeProducts = (list: any[]): Product[] =>
    Array.isArray(list) ? list.filter(Boolean).map(normalizeProduct) : [];

/**
 * Orders from the backend already match the Order type. Items reference a populated
 * product (name/images), or null if that product was deleted since.
 */
export const normalizeOrder = (o: any): Order => ({
    ...o,
    items: Array.isArray(o?.items) ? o.items.map((it: any) => ({ ...it, product: it?.product ?? { images: [] } })) : [],
    subtotal: Number(o?.subtotal ?? 0),
    shippingCost: Number(o?.shippingCost ?? 0),
    tax: Number(o?.tax ?? 0),
    totalAmount: Number(o?.totalAmount ?? 0),
});

export const normalizeOrders = (list: any[]): Order[] =>
    Array.isArray(list) ? list.map(normalizeOrder) : [];
