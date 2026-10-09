import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Request, Response, NextFunction } from "express";

interface JwtPayload {
    id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        const token = header.split(" ")[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({ success: false, message: "Server misconfigured: JWT_SECRET missing" });
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: "Not authorized, user not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth error:", err);
        return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "User role is not authorized to access this route" });
        }
        next();
    };
};
