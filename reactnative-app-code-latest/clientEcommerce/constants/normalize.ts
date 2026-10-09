import type { Product, Order } from "@/constants/types";
import { DELIVERY_FEE } from "@/constants";

/**
 * The WEB backend (forever-full-stack) stores products as:
 *   { _id, name, description, price, image: string[], category, subCategory, sizes: string[], bestseller, date }
 * The mobile UI was built around a richer shape (images[], ratings, isFeatured, stock...).
 * This maps the web product onto the shape the screens already render, so the UI keeps working.
 */
export const normalizeProduct = (p: any): Product => {
    const images: string[] = Array.isArray(p?.image)
        ? p.image
        : Array.isArray(p?.images)
        ? p.images
        : p?.image
        ? [p.image]
        : [];

    return {
        _id: p?._id,
        name: p?.name ?? "",
        description: p?.description ?? "",
        price: Number(p?.price ?? 0),
        comparePrice: undefined,
        images,
        sizes: Array.isArray(p?.sizes) ? p.sizes : [],
        category: p?.category ?? "",
        subCategory: p?.subCategory ?? "",
        // web has no stock concept -> treat as available
        stock: typeof p?.stock === "number" ? p.stock : 99,
        ratings: { average: 4.5, count: 0 },
        isFeatured: !!p?.bestseller,
        isActive: true,
        createdAt: p?.date ? new Date(p.date).toISOString() : new Date().toISOString(),
    };
};

export const normalizeProducts = (list: any[]): Product[] =>
    Array.isArray(list) ? list.map(normalizeProduct) : [];

const ORDER_STATUS_MAP: Record<string, Order["orderStatus"]> = {
    "Order Placed": "placed",
    Placed: "placed",
    Packing: "processing",
    Processing: "processing",
    Shipped: "shipped",
    "Out for delivery": "shipped",
    Delivered: "delivered",
    Cancelled: "cancelled",
};

/**
 * Web order shape:
 *   { _id, userId, items: [], amount, address: {}, status, paymentMethod, payment: bool, date }
 * Mapped onto the mobile Order shape used by orders screens.
 */
export const normalizeOrder = (o: any): Order => {
    const status = ORDER_STATUS_MAP[o?.status] ?? "placed";

    const items = Array.isArray(o?.items)
        ? o.items.map((it: any) => {
              const imgs: string[] = Array.isArray(it?.image)
                  ? it.image
                  : Array.isArray(it?.images)
                  ? it.images
                  : it?.image
                  ? [it.image]
                  : [];
              return {
                  product: { images: imgs } as any,
                  name: it?.name ?? "",
                  quantity: Number(it?.quantity ?? 1),
                  price: Number(it?.price ?? 0),
                  size: it?.size ?? "",
              };
          })
        : [];

    const addr = o?.address ?? {};

    // The web backend stores `amount` = cart subtotal + the flat delivery fee.
    // Split it back out so the order summary stays consistent with cart/checkout.
    const amount = Number(o?.amount ?? 0);
    const shippingCost = amount > 0 ? DELIVERY_FEE : 0;
    const subtotal = Math.max(0, amount - shippingCost);

    return {
        _id: o?._id,
        user: o?.userId ?? "",
        orderNumber: o?._id ? String(o._id).slice(-6).toUpperCase() : "",
        items,
        shippingAddress: {
            street: addr.street ?? [addr.firstName, addr.lastName].filter(Boolean).join(" ") ?? "",
            city: addr.city ?? "",
            state: addr.state ?? "",
            zipCode: addr.zipcode ?? addr.zipCode ?? "",
            country: addr.country ?? "",
        },
        paymentMethod: o?.paymentMethod ?? "COD",
        paymentStatus: o?.payment ? "paid" : "pending",
        orderStatus: status,
        subtotal,
        shippingCost,
        tax: 0,
        totalAmount: amount,
        createdAt: o?.date ? new Date(o.date).toISOString() : new Date().toISOString(),
    };
};

export const normalizeOrders = (list: any[]): Order[] =>
    Array.isArray(list) ? list.map(normalizeOrder).reverse() : [];
