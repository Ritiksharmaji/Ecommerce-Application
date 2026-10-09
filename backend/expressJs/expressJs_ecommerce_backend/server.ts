import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import makeAdmin from "./scripts/makeAdmin.js";
import AuthRouter from "./routes/authRoutes.js";
import ProductRouter from "./routes/productsRoutes.js";
import CartRouter from "./routes/cartRoutes.js";
import OrderRouter from "./routes/ordersRoutes.js";
import AddressRouter from "./routes/addressRoutes.js";
import WishlistRouter from "./routes/wishlistRoutes.js";
import AdminRouter from "./routes/adminRoutes.js";
import paymentRouter from "./routes/paymentRoute.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import Address from "./models/Address.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

// Connect to MongoDB
await connectDB();
// Drop indexes no longer in the schemas (e.g. the old unique index on Address.user)
await Address.syncIndexes();
// Middleware
app.use(cors());
// Stripe Webhook - must be registered before express.json() so the raw body
// is available for signature verification
process.env.STRIPE_SECRET_KEY && app.post("/api/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json());
app.use(requestLogger);
await makeAdmin();
process.env.STRIPE_SECRET_KEY && app.use("/api/payments", paymentRouter);
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.use("/api/auth", AuthRouter);
app.use("/api/products", ProductRouter);
app.use("/api/cart", CartRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/addresses", AddressRouter);
app.use("/api/wishlist", WishlistRouter);
app.use("/api/admin", AdminRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
