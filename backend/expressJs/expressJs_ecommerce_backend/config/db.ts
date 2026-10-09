import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("[DB] MONGODB_URI is not set in your .env file.");
        process.exit(1);
    }

    mongoose.connection.on("connected", () => {
        console.log("[DB] MongoDB connected");
    });

    mongoose.connection.on("error", (err) => {
        console.error("[DB] MongoDB connection error:", err.message);
    });

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[DB] Failed to connect to MongoDB:", message);

        if (message.includes("ENOTFOUND") || message.includes("querySrv")) {
            console.error(
                "\nDNS could not resolve the Atlas SRV record. Common fixes:\n" +
                "  1. Confirm the cluster hostname matches Atlas exactly (Connect -> Drivers).\n" +
                "  2. Make sure the cluster is not paused/deleted in Atlas.\n" +
                "  3. Switch your machine DNS to 8.8.8.8 / 1.1.1.1 (ISPs/VPNs often block SRV).\n" +
                "  4. Or use the non-SRV connection string (mongodb:// with :27017 hosts) from Atlas.\n"
            );
        }
        process.exit(1);
    }
};

export default connectDB;
