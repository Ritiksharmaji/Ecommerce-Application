import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

/**
 * The database is shared with the previous web backend ("forever"), which stores orders as
 *   { userId: "<id string>", items: [{ _id, name, price, quantity, size, image[] }], amount,
 *     address: { firstName, lastName, street, city, state, zipcode, country, phone },
 *     status: "Order Placed", paymentMethod: "COD" | "Stripe" | "Razorpay", payment: bool, date }
 * These helpers read those legacy orders and return them in this API's Order shape, so every
 * client sees all orders no matter which backend created them.
 */

const LEGACY_TO_STATUS: Record<string, string> = {
    "Order Placed": "placed",
    Packing: "processing",
    Shipped: "shipped",
    "Out for delivery": "shipped",
    Delivered: "delivered",
    Cancelled: "cancelled",
};

// Used to keep the legacy `status` field in sync when an admin updates a legacy order
export const STATUS_TO_LEGACY: Record<string, string> = {
    placed: "Order Placed",
    processing: "Packing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

const LEGACY_DELIVERY_FEE = 10;

export const isLegacyOrder = (raw: any) => !!raw && !raw.user && !!raw.userId;

const legacyCollection = () => Order.collection;

const lookupUsers = async (ids: string[]) => {
    const valid = [...new Set(ids)].filter((id) => mongoose.isValidObjectId(id));
    const users = await User.find({ _id: { $in: valid } }).select("name email");
    return new Map(users.map((u) => [u._id.toString(), { _id: u._id, name: u.name, email: u.email }]));
};

export const toApiOrder = (raw: any, users?: Map<string, any>) => {
    const amount = Number(raw.amount ?? 0);
    const shippingCost = amount > 0 ? Math.min(LEGACY_DELIVERY_FEE, amount) : 0;
    const itemsTotal = (raw.items ?? []).reduce((s: number, it: any) => s + Number(it.price ?? 0) * Number(it.quantity ?? 1), 0);
    const addr = raw.address ?? {};
    const method = String(raw.paymentMethod ?? "").toLowerCase();
    const date = raw.date ? new Date(raw.date) : raw._id.getTimestamp();

    return {
        _id: raw._id,
        user: users?.get(String(raw.userId)) ?? raw.userId,
        orderNumber: "LEG-" + raw._id.toString().slice(-6).toUpperCase(),
        items: (raw.items ?? []).map((it: any) => ({
            _id: it._id,
            product: { _id: it._id, name: it.name, images: Array.isArray(it.image) ? it.image : it.image ? [it.image] : [] },
            name: it.name,
            quantity: Number(it.quantity ?? 1),
            price: Number(it.price ?? 0),
            size: it.size ?? "",
        })),
        shippingAddress: {
            street: addr.street ?? "",
            city: addr.city ?? "",
            state: addr.state ?? "",
            zipCode: addr.zipcode ?? addr.zipCode ?? "",
            country: addr.country ?? "",
        },
        paymentMethod: method === "cod" || method === "cash" ? "cash" : method || "cash",
        paymentStatus: raw.paymentStatus ?? (raw.payment ? "paid" : "pending"),
        orderStatus: raw.orderStatus ?? LEGACY_TO_STATUS[raw.status] ?? "placed",
        subtotal: itemsTotal || Math.max(0, amount - shippingCost),
        shippingCost: itemsTotal ? Math.max(0, amount - itemsTotal) : shippingCost,
        tax: 0,
        totalAmount: amount,
        notes: addr.phone ? `Phone: ${addr.phone}` : undefined,
        createdAt: date,
        updatedAt: date,
        legacy: true,
    };
};

// Legacy orders matching `filter` (merged with the legacy marker), already converted
export const findLegacyOrders = async (filter: Record<string, any> = {}) => {
    const raws = await legacyCollection().find({ userId: { $exists: true }, user: { $exists: false }, ...filter }).toArray();
    const users = await lookupUsers(raws.map((r: any) => String(r.userId)));
    return raws.map((r) => toApiOrder(r, users));
};

export const findLegacyOrderById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) return null;
    const raw = await legacyCollection().findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!isLegacyOrder(raw)) return null;
    return toApiOrder(raw, await lookupUsers([String(raw!.userId)]));
};

// Admin status update on a legacy order: set the new fields and keep the old ones in sync
export const updateLegacyOrderStatus = async (id: string, orderStatus?: string, paymentStatus?: string) => {
    const set: Record<string, any> = {};
    if (orderStatus) {
        set.orderStatus = orderStatus;
        if (STATUS_TO_LEGACY[orderStatus]) set.status = STATUS_TO_LEGACY[orderStatus];
    }
    if (paymentStatus) {
        set.paymentStatus = paymentStatus;
        set.payment = paymentStatus === "paid";
    }
    await legacyCollection().updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: set });
    return findLegacyOrderById(id);
};
