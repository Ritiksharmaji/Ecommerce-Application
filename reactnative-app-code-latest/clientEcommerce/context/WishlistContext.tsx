import { Product, WishlistContextType } from "@/constants/types";
import api from "@/constants/api";
import { normalizeProducts } from "@/constants/normalize";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// The web backend has no wishlist concept, so the wishlist is a mobile-only feature
// persisted on the device. We store just the product ids and re-resolve the full
// product details from the live catalogue on launch.
const WISHLIST_KEY = "wishlist_ids";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const persistIds = async (products: Product[]) => {
        try {
            const ids = products.map((p) => p._id);
            await SecureStore.setItemAsync(WISHLIST_KEY, JSON.stringify(ids));
        } catch {
            // ignore persistence failures
        }
    };

    // Restore saved ids, then resolve them against the live product list.
    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const stored = await SecureStore.getItemAsync(WISHLIST_KEY);
            const ids: string[] = stored ? JSON.parse(stored) : [];
            if (ids.length === 0) {
                setWishlist([]);
                return;
            }
            const { data } = await api.get("/api/product/list");
            if (data?.success) {
                const all = normalizeProducts(data.products);
                const idSet = new Set(ids);
                setWishlist(all.filter((p) => idSet.has(p._id)));
            }
        } catch {
            // keep whatever is in memory
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const toggleWishlist = async (product: Product) => {
        setWishlist((prev) => {
            const exists = prev.some((p) => p._id === product._id);
            const next = exists ? prev.filter((p) => p._id !== product._id) : [...prev, product];
            persistIds(next);
            return next;
        });
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
