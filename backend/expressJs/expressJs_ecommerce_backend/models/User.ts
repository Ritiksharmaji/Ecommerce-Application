import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { IUser } from "../types/index.js";

const userSchema = new mongoose.Schema<IUser>(
    {
        name: { type: String, trim: true, default: "User" },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        image: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    { timestamps: true }
);

// Hash password before saving (only when changed). Async hooks may return a
// promise instead of calling next().
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare a plaintext password with the stored hash
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
