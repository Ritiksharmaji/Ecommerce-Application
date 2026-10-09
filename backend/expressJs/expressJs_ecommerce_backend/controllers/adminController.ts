import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { Request, Response } from "express";
import { findLegacyOrders } from "../utils/legacyOrders.js";

// Get dashboard stats
// GET /api/admin/stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Include orders created by the previous web backend (see utils/legacyOrders.ts)
        const current = (await Order.find({ user: { $exists: true } }).populate("user", "name email")).map((o) => o.toObject());
        const legacy = await findLegacyOrders();
        const allOrders: any[] = [...current, ...legacy].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const totalRevenue = allOrders.filter((o) => o.orderStatus !== "cancelled").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const recentOrders = allOrders.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue,
                recentOrders,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
