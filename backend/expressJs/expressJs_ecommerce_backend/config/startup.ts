import connectDB from "./db.js";
import makeAdmin from "../scripts/makeAdmin.js";
import Address from "../models/Address.js";

let ready: Promise<void> | null = null;

// Connects to MongoDB and runs the one-time startup tasks. Safe to call on every request:
// the work runs once per process (once per Lambda container), later calls reuse it.
export const ensureReady = (): Promise<void> => {
    if (!ready) {
        ready = (async () => {
            await connectDB();
            // Drop indexes no longer in the schemas (e.g. the old unique index on Address.user)
            await Address.syncIndexes();
            await makeAdmin();
        })().catch((err) => {
            ready = null; // let the next request retry instead of failing forever
            throw err;
        });
    }
    return ready;
};
