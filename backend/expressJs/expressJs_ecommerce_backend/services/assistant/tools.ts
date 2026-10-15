import mongoose from "mongoose";
import { z } from "zod";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import Address from "../../models/Address.js";
import Order from "../../models/Order.js";
import Wishlist from "../../models/Wishlist.js";
import type { ToolContext } from "./types.js";

/**
 * Shopping-assistant tools - shared by every AI provider.
 *
 * Each tool is defined ONCE here in plain JSON Schema (`TOOL_DEFINITIONS`); providers/gemini.ts and
 * providers/claude.ts convert the list to their own SDK format.
 *
 * SERVER tools run here, read-only, scoped to the signed-in user (req.user) - the model can never reach
 * another user's data because no tool accepts a user id.
 * CLIENT actions are not executed on the server: the turn ends and the app performs them (navigation,
 * cart update, address form, order confirmation + payment) and sends the result back.
 */

const CATEGORIES = ["Men", "Women", "Kids", "Shoes", "Bags", "Other"] as const;
const SCREENS = ["Home", "Shop", "ProductDetails", "Cart", "Favorites", "Profile", "Checkout", "Orders", "OrderDetails", "SignIn"] as const;

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
    type: "object" as const,
    properties,
    required,
    additionalProperties: false,
});

/** A tool in provider-neutral form: name, when to use it, and its input as JSON Schema. */
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: ReturnType<typeof obj>;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    // ------------------------------------------------------------- server tools
    {
        name: "search_products",
        description:
            "Search the Shopvra catalogue. Use for any question about what is for sale, prices, sizes or stock. " +
            "Returns up to `limit` active products; the app shows them to the user as product cards.",
        parameters: obj({
            query: { type: "string", description: "Free-text keywords, e.g. 'denim jacket'. Empty string for none." },
            category: { type: "string", enum: [...CATEGORIES, "Any"] },
            maxPrice: { type: "number", description: "Maximum price in USD, 0 for no limit." },
            sort: { type: "string", enum: ["relevance", "price_low", "price_high", "newest", "rating"] },
            limit: { type: "integer", description: "1-8" },
        }, ["query", "category", "maxPrice", "sort", "limit"]),
    },
    {
        name: "get_product_details",
        description: "Full details (description, sizes, stock, rating, images) of one product by its id.",
        parameters: obj({ productId: { type: "string" } }, ["productId"]),
    },
    {
        name: "get_cart",
        description: "The signed-in user's cart (items, sizes, quantities, total). Requires sign-in.",
        parameters: obj({}),
    },
    {
        name: "get_saved_addresses",
        description: "The signed-in user's saved delivery addresses (default first). Requires sign-in.",
        parameters: obj({}),
    },
    {
        name: "get_wishlist",
        description: "The signed-in user's wishlist (saved / favourite products). Requires sign-in.",
        parameters: obj({}),
    },
    {
        name: "get_orders",
        description: "The signed-in user's 10 most recent orders with status. Requires sign-in.",
        parameters: obj({}),
    },
    // ------------------------------------------------------------ client actions
    {
        name: "navigate",
        description:
            "Open a screen in the app. ProductDetails needs productId; OrderDetails needs orderId; Shop accepts an optional category.",
        parameters: obj({
            screen: { type: "string", enum: [...SCREENS] },
            productId: { type: "string", description: "Empty string when not needed." },
            orderId: { type: "string", description: "Empty string when not needed." },
            category: { type: "string", enum: [...CATEGORIES, "Any"] },
        }, ["screen", "productId", "orderId", "category"]),
    },
    {
        name: "add_to_cart",
        description:
            "Add a product to the user's cart. If the product has sizes, `size` must be one of them - ask the user if unknown. " +
            "Works for guests too.",
        parameters: obj({
            productId: { type: "string" },
            size: { type: "string", description: "Empty string for products without sizes." },
            quantity: { type: "integer", description: "1-10" },
        }, ["productId", "size", "quantity"]),
    },
    {
        name: "show_address_form",
        description:
            "Show an address form in the chat so the user can create a delivery address. Prefill any fields the user already " +
            "mentioned (empty string otherwise). Never collect addresses as free text - always use this form. Requires sign-in.",
        parameters: obj({
            type: { type: "string", enum: ["Home", "Work", "Other"] },
            street: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zipCode: { type: "string" },
            country: { type: "string" },
        }, ["type", "street", "city", "state", "zipCode", "country"]),
    },
    {
        name: "confirm_order",
        description:
            "Show an order summary with a Confirm button. On confirm the app places the order from the current cart; for " +
            "paymentMethod 'stripe' it then opens Stripe's secure card page. Never ask for card numbers yourself. " +
            "Call only when the cart is not empty and the user chose an address and a payment method. Requires sign-in.",
        parameters: obj({
            addressId: { type: "string", description: "Id of a saved address from get_saved_addresses." },
            paymentMethod: { type: "string", enum: ["cash", "stripe"] },
            notes: { type: "string", description: "Delivery notes, empty string for none." },
        }, ["addressId", "paymentMethod", "notes"]),
    },
    {
        name: "show_auth_form",
        description:
            "Show a sign-in or create-account form in the chat. The user types the password in the form, so it never " +
            "reaches you. Prefill the email/name the user mentioned (empty string otherwise). Use mode 'signup' when the user " +
            "wants a new account, 'signin' otherwise. Only for guests.",
        parameters: obj({
            mode: { type: "string", enum: ["signin", "signup"] },
            email: { type: "string" },
            name: { type: "string", description: "Full name for signup, empty string otherwise." },
        }, ["mode", "email", "name"]),
    },
    {
        name: "update_cart_item",
        description:
            "Change the quantity of a cart line, or remove it with quantity 0. productId and size must match a line from get_cart. " +
            "Works for guests too.",
        parameters: obj({
            productId: { type: "string" },
            size: { type: "string", description: "The line's size, empty string if none." },
            quantity: { type: "integer", description: "0-10; 0 removes the item." },
        }, ["productId", "size", "quantity"]),
    },
    {
        name: "clear_cart",
        description: "Show a confirmation card to remove every item from the cart. Works for guests too.",
        parameters: obj({}),
    },
    {
        name: "update_wishlist",
        description: "Add a product to (add=true) or remove it from (add=false) the wishlist. Works for guests too.",
        parameters: obj({
            productId: { type: "string" },
            add: { type: "boolean" },
        }, ["productId", "add"]),
    },
    {
        name: "delete_address",
        description: "Show a confirmation card to delete one saved address (id from get_saved_addresses). Requires sign-in.",
        parameters: obj({ addressId: { type: "string" } }, ["addressId"]),
    },
    {
        name: "sign_out",
        description: "Show a confirmation card to sign the user out. This ends the chat. Requires sign-in.",
        parameters: obj({}),
    },
    {
        name: "delete_account",
        description:
            "Show the permanent account-deletion card; the user re-enters their password in the card to confirm. Deletes the " +
            "account, addresses, cart and wishlist. Only when the user clearly asks to delete their account. Requires sign-in.",
        parameters: obj({}),
    },
];

export const CLIENT_ACTIONS = new Set([
    "navigate", "add_to_cart", "show_address_form", "confirm_order",
    "show_auth_form", "update_cart_item", "clear_cart", "update_wishlist", "delete_address", "sign_out", "delete_account",
]);
/** Actions that only make sense for a signed-in user. */
const AUTH_ACTIONS = new Set(["show_address_form", "confirm_order", "delete_address", "sign_out", "delete_account"]);

// Input validation (inputs are model output - never trust them blindly).
const schemas = {
    search_products: z.object({
        query: z.string().max(100),
        category: z.enum([...CATEGORIES, "Any"]),
        maxPrice: z.number().min(0),
        sort: z.enum(["relevance", "price_low", "price_high", "newest", "rating"]),
        limit: z.number().int(),
    }),
    get_product_details: z.object({ productId: z.string() }),
};

export interface ProductCard {
    id: string;
    name: string;
    price: number;
    comparePrice?: number;
    image?: string;
    category: string;
    rating: number;
}

export interface ServerToolOutcome {
    content: string;
    isError?: boolean;
    products?: ProductCard[];
}

const isId = (id: string) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const json = (value: unknown): ServerToolOutcome => ({ content: JSON.stringify(value) });
const LOGIN_REQUIRED: ServerToolOutcome = {
    content: JSON.stringify({ error: "login_required", hint: "Ask the user to sign in; you can navigate to SignIn." }),
    isError: true,
};

const toCard = (p: any): ProductCard => ({
    id: String(p._id),
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice || undefined,
    image: p.images?.[0],
    category: p.category,
    rating: p.ratings?.average ?? 0,
});

/** Validation for a client action before it is sent to the app. Returns an error message or null. */
export function checkClientAction(name: string, input: any, ctx: ToolContext): string | null {
    if (AUTH_ACTIONS.has(name) && !ctx.userId) return "login_required: ask the user to sign in first (navigate to SignIn).";
    if (name === "navigate") {
        if (input?.screen === "ProductDetails" && !isId(input.productId)) return "ProductDetails needs a valid productId.";
        if (input?.screen === "OrderDetails" && !isId(input.orderId)) return "OrderDetails needs a valid orderId.";
    }
    if (name === "add_to_cart" && !isId(input?.productId)) return "add_to_cart needs a valid productId from search results.";
    if (name === "show_auth_form" && ctx.userId) return "The user is already signed in.";
    if ((name === "update_cart_item" || name === "update_wishlist") && !isId(input?.productId)) return `${name} needs a valid productId.`;
    if (name === "delete_address" && !isId(input?.addressId)) return "delete_address needs a saved addressId (use get_saved_addresses).";
    if (name === "confirm_order" && !isId(input?.addressId)) return "confirm_order needs a saved addressId (use get_saved_addresses).";
    return null;
}

export async function runServerTool(name: string, rawInput: unknown, ctx: ToolContext): Promise<ServerToolOutcome> {
    switch (name) {
        case "search_products": {
            const parsed = schemas.search_products.safeParse(rawInput);
            if (!parsed.success) return { content: "Invalid input: " + parsed.error.message, isError: true };
            const { query, category, maxPrice, sort, limit } = parsed.data;
            const filter: Record<string, unknown> = { isActive: true };
            if (category !== "Any") filter.category = category;
            if (maxPrice > 0) filter.price = { $lte: maxPrice };
            const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 6);
            if (words.length) {
                filter.$and = words.map((w) => ({
                    $or: [{ name: { $regex: escapeRegex(w), $options: "i" } }, { description: { $regex: escapeRegex(w), $options: "i" } }],
                }));
            }
            const sortBy: Record<string, 1 | -1> =
                sort === "price_low" ? { price: 1 } : sort === "price_high" ? { price: -1 } : sort === "rating" ? { "ratings.average": -1 } : { createdAt: -1 };
            const products = await Product.find(filter).sort(sortBy).limit(Math.min(Math.max(limit, 1), 8)).lean();
            const cards = products.map(toCard);
            return {
                content: JSON.stringify({
                    count: products.length,
                    products: products.map((p: any) => ({
                        id: String(p._id), name: p.name, price: p.price, comparePrice: p.comparePrice ?? null,
                        category: p.category, sizes: p.sizes, inStock: p.stock > 0, rating: p.ratings?.average ?? 0,
                    })),
                }),
                products: cards,
            };
        }
        case "get_product_details": {
            const parsed = schemas.get_product_details.safeParse(rawInput);
            if (!parsed.success || !isId(parsed.data.productId)) return { content: "Invalid productId", isError: true };
            const p: any = await Product.findOne({ _id: parsed.data.productId, isActive: true }).lean();
            if (!p) return { content: "Product not found", isError: true };
            return {
                content: JSON.stringify({
                    id: String(p._id), name: p.name, description: p.description, price: p.price, comparePrice: p.comparePrice ?? null,
                    category: p.category, sizes: p.sizes, stock: p.stock, rating: p.ratings,
                }),
                products: [toCard(p)],
            };
        }
        case "get_cart": {
            if (!ctx.userId) return LOGIN_REQUIRED;
            const cart: any = await Cart.findOne({ user: ctx.userId }).populate("items.product", "name price images stock").lean();
            const items = (cart?.items ?? []).filter((i: any) => i.product).map((i: any) => ({
                productId: String(i.product._id), name: i.product.name, size: i.size || null, quantity: i.quantity, price: i.price,
            }));
            const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
            return json({ items, subtotal, shipping: items.length ? 2 : 0, total: subtotal + (items.length ? 2 : 0) });
        }
        case "get_saved_addresses": {
            if (!ctx.userId) return LOGIN_REQUIRED;
            const list = await Address.find({ user: ctx.userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
            return json(list.map((a: any) => ({
                id: String(a._id), type: a.type, street: a.street, city: a.city, state: a.state, zipCode: a.zipCode, country: a.country, isDefault: a.isDefault,
            })));
        }
        case "get_wishlist": {
            if (!ctx.userId) return LOGIN_REQUIRED;
            const wishlist: any = await Wishlist.findOne({ user: ctx.userId }).populate("products", "name price comparePrice images category ratings isActive").lean();
            const list = (wishlist?.products ?? []).filter((p: any) => p?.isActive !== false);
            return {
                content: JSON.stringify(list.map((p: any) => ({ id: String(p._id), name: p.name, price: p.price, category: p.category }))),
                products: list.map(toCard),
            };
        }
        case "get_orders": {
            if (!ctx.userId) return LOGIN_REQUIRED;
            const orders = await Order.find({ user: ctx.userId }).sort({ createdAt: -1 }).limit(10).lean();
            return json(orders.map((o: any) => ({
                id: String(o._id), orderNumber: o.orderNumber, status: o.orderStatus, paymentStatus: o.paymentStatus,
                paymentMethod: o.paymentMethod, total: o.totalAmount, items: o.items?.length ?? 0, placedAt: o.createdAt,
            })));
        }
        default:
            return { content: `Unknown tool ${name}`, isError: true };
    }
}
