import { Product, WishlistContextType } from "@/constants/types";
import api, { fetchAllProducts } from "@/constants/api";
import { normalizeProducts } from "@/constants/normalize";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/constants/storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

// Logged in: the wishlist lives on the server (GET /api/wishlist, POST /api/wishlist/toggle).
// Guest: product ids are kept on the device and pushed to the server after sign-in.
const WISHLIST_KEY = "wishlist_ids";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { token, isLoaded } = useAuth();
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const readGuestIds = async (): Promise<string[]> => {
        try {
            const stored = await storage.getItem(WISHLIST_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    };

    const writeGuestIds = async (products: Product[]) => {
        try {
            await storage.setItem(WISHLIST_KEY, JSON.stringify(products.map((p) => p._id)));
        } catch {
            // ignore persistence failures
        }
    };

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const guestIds = await readGuestIds();
            if (token) {
                const { data } = await api.get("/api/wishlist");
                let products = normalizeProducts(data.data);
                // Move guest favourites into the account, then forget them locally
                const toAdd = guestIds.filter((id) => !products.some((p) => p._id === id));
                for (const productId of toAdd) {
                    const res = await api.post("/api/wishlist/toggle", { productId }).catch(() => null);
                    if (res?.data?.data) products = normalizeProducts(res.data.data);
                }
                if (guestIds.length) await storage.removeItem(WISHLIST_KEY);
                setWishlist(products);
            } else if (guestIds.length === 0) {
                setWishlist([]);
            } else {
                const idSet = new Set(guestIds);
                setWishlist((await fetchAllProducts()).filter((p) => idSet.has(p._id)));
            }
        } catch (e) {
            console.error("Error fetching wishlist:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded) fetchWishlist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, token]);

    const toggleWishlist = async (product: Product) => {
        const exists = wishlist.some((p) => p._id === product._id);
        const next = exists ? wishlist.filter((p) => p._id !== product._id) : [...wishlist, product];
        setWishlist(next);

        if (!token) {
            writeGuestIds(next);
            return;
        }
        try {
            const { data } = await api.post("/api/wishlist/toggle", { productId: product._id });
            setWishlist(normalizeProducts(data.data));
        } catch (e: any) {
            setWishlist(wishlist);
            Toast.show({ type: "error", text1: "Wishlist update failed", text2: e?.message });
        }
    };

    const isInWishlist = (productId: string) => wishlist.some((p) => p._id === productId);

    return (
        <WishlistContext.Provider value={{ wishlist, loading, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within WishlistProvider");
    }
    return context;
}
