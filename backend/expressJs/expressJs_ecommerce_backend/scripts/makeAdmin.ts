import User from "../models/User.js";

// Seeds (or promotes) the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
// Runs on server start. Creates the admin user if missing, otherwise
// promotes the existing user to the "admin" role.
const makeAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL?.toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            console.warn("[admin] ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin seed.");
            return;
        }

        const existing = await User.findOne({ email });

        if (existing) {
            if (existing.role !== "admin") {
                existing.role = "admin";
                await existing.save();
                console.log(`[admin] Promoted ${email} to admin`);
            }
            return;
        }

        // .create() triggers the pre-save hook, so the password is hashed.
        await User.create({ name: "Admin", email, password, role: "admin" });
        console.log(`[admin] Admin account created: ${email}`);
    } catch (err: any) {
        console.error("[admin] Admin seed/promotion failed:", err.message);
    }
};

export default makeAdmin;
