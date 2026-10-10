import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import Address from "../models/Address.js";

const signToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    const expiresIn = process.env.JWT_EXPIRE || "7d";
    return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};

const sanitize = (user: any) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
});

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const user = await User.create({ name, email, password });
        const token = signToken(user._id.toString());

        return res.status(201).json({ success: true, token, user: sanitize(user) });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // password has select:false, so explicitly select it here
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = signToken(user._id.toString());
        return res.json({ success: true, token, user: sanitize(user) });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/auth/me  (requires protect middleware)
export const getMe = async (req: Request, res: Response) => {
    return res.json({ success: true, user: sanitize(req.user) });
};

// DELETE /api/auth/me  (requires protect middleware)
// Self-service account deletion (required by Google Play for apps with sign-up).
// Body: { password } - re-confirms the user's identity before anything is removed.
// Deletes the user, cart, wishlist and saved addresses. Orders are kept for accounting/tax records
// (see the privacy policy at https://shopvra.space/privacy) but no longer link to a user account.
export const deleteMe = async (req: Request, res: Response) => {
    try {
        const { password } = req.body ?? {};
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required to delete your account" });
        }

        const user = await User.findById(req.user!._id).select("+password");
        if (!user) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }
        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Admin accounts can't be deleted from the app" });
        }
        if (!(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        await Promise.all([
            Cart.deleteOne({ user: user._id }),
            Wishlist.deleteOne({ user: user._id }),
            Address.deleteMany({ user: user._id }),
        ]);
        await user.deleteOne();

        return res.json({ success: true, message: "Your account has been deleted" });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
