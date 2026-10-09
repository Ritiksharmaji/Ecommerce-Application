import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { describePassword } from "../middleware/requestLogger.js";

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
        console.log(`[login] email="${email}" password=${describePassword(password)} -> user ${user ? `found (role=${user.role})` : "NOT FOUND"}`);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const match = await user.comparePassword(password);
        console.log(`[login] ${email}: password ${match ? "MATCHES" : "DOES NOT MATCH"}`);
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
