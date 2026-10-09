import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { Request, Response } from "express";
import { findLegacyOrders, findLegacyOrderById, isLegacyOrder, updateLegacyOrderStatus } from "../utils/legacyOrders.js";

const byNewest = (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

// Get user orders
// GET /api/orders
export const getOrders = async (req: Request, res: Response) => {
    try {
        const query = { user: req.user._id };

        const orders = await Order.find(query).populate("items.product", "name images").sort("-createdAt");
        // Include orders this user placed through the previous web backend
        const legacy = await findLegacyOrders({ userId: req.user._id.toString() });

        res.json({
            success: true,
            data: [...orders.map((o) => o.toObject()), ...legacy].sort(byNewest),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single order
// GET /api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
    try {
        const order: any = (await Order.findOne({ _id: req.params.id, user: { $exists: true } }).populate("items.product", "name images")) ?? (await findLegacyOrderById(String(req.params.id)));

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const ownerId = (order.user?._id ?? order.user).toString();
        if (ownerId !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create order from cart
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { shippingAddress, notes } = req.body;

        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        // Verify stock and prepare order items
        const orderItems = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);

            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${(item.product as any).name}`,
                });
            }

            orderItems.push({
                product: item.product._id,
                name: (item.product as any).name,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
            });

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        const subtotal = cart.totalAmount;
        const shippingCost = 2;
        const tax = 0;
        const totalAmount = subtotal + shippingCost + tax;

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod: req.body.paymentMethod || "cash",
            paymentStatus: req.body.paymentMethod === "stripe" ? "pending" : "pending",
            subtotal,
            shippingCost,
            tax,
            totalAmount,
            notes,
            paymentIntentId: req.body.paymentIntentId,
            orderNumber: "ORD-" + Date.now(),
        });

        if (req.body.paymentMethod !== "stripe") {
            cart.items = [];
            cart.totalAmount = 0;
            await cart.save();
        }

        res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update order status
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderStatus, paymentStatus } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        const raw = await Order.collection.findOne({ _id: new mongoose.Types.ObjectId(String(req.params.id)) });
        if (isLegacyOrder(raw)) {
            return res.json({ success: true, data: await updateLegacyOrderStatus(String(req.params.id), orderStatus, paymentStatus) });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (orderStatus === "delivered") order.deliveredAt = new Date();

        await order.save();

        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all orders
// GET /api/orders/admin/all
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query: any = { user: { $exists: true } };

        if (status) query.orderStatus = status;

        // New orders + orders from the previous web backend, merged and paginated together
        const current = await Order.find(query).populate("user", "name email").populate("items.product", "name");
        const legacy = (await findLegacyOrders()).filter((o) => !status || o.orderStatus === status);
        const all = [...current.map((o) => o.toObject()), ...legacy].sort(byNewest);
        const total = all.length;
        const start = (Number(page) - 1) * Number(limit);
        const orders = all.slice(start, start + Number(limit));

        res.json({
            success: true,
            data: orders,
            pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
