import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import AuthRouter from "./routes/authRoutes.js";
import ProductRouter from "./routes/productsRoutes.js";
import CartRouter from "./routes/cartRoutes.js";
import OrderRouter from "./routes/ordersRoutes.js";
import AddressRouter from "./routes/addressRoutes.js";
import WishlistRouter from "./routes/wishlistRoutes.js";
import AdminRouter from "./routes/adminRoutes.js";
import paymentRouter from "./routes/paymentRoute.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import { requestLogger } from "./middleware/requestLogger.js";

// The Express app, shared by the local server (server.ts) and AWS Lambda (lambda.ts).
const app = express();

// Behind CloudFront/proxies: use X-Forwarded-For for req.ip
app.set("trust proxy", true);

// CORS_ORIGINS (comma separated) limits which websites may call the API, e.g.
// "https://shopvra.space,https://www.shopvra.space". Unset = allow all (local development).
// The mobile app sends no Origin header, so it is always allowed.
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));

// Stripe Webhook - must be registered before express.json() so the raw body
// is available for signature verification
process.env.STRIPE_SECRET_KEY && app.post("/api/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json());
app.use(requestLogger);
process.env.STRIPE_SECRET_KEY && app.use("/api/payments", paymentRouter);

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

// JSON 404 for unknown routes
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// JSON errors (e.g. invalid JSON body) instead of Express's HTML page with a stack trace
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error("Unhandled error:", err);
    res.status(status).json({ success: false, message: status >= 500 ? "Internal server error" : err.message });
});

export default app;
