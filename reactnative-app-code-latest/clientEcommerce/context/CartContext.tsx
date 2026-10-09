import { Product } from "@/constants/types";
import api from "@/constants/api";
import { normalizeProduct } from "@/constants/normalize";
import { useAuth } from "@/context/AuthContext";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Toast from "react-native-toast-message";

export type CartItem = {
  id: string; // productId
  productId: string;
  product: Product;
  quantity: number;
  size: string;
  price: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, quantity: number, size: string) => void;
  clearCart: () => void;
  // Resolves once all pending server cart updates have finished (call before placing an order)
  flush: () => Promise<void>;
  refreshCart: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Backend cart shape: { items: [{ product: {_id,name,images,price,stock} | null, quantity, price, size }], totalAmount }
const fromServer = (cart: any): CartItem[] =>
  (cart?.items ?? [])
    .filter((it: any) => it?.product) // product may have been deleted
    .map((it: any) => ({
      id: it.product._id,
      productId: it.product._id,
      product: normalizeProduct(it.product),
      quantity: it.quantity,
      size: it.size || "",
      price: it.price,
    }));

const sameLine = (it: CartItem, productId: string, size: string) => it.productId === productId && it.size === size;

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isLoaded } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = cartItems;
  const prevToken = useRef<string | null>(null);

  // Server updates run one at a time, in order, so the last response reflects every change.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const enqueue = (fn: () => Promise<void>) => {
    queue.current = queue.current.then(fn).catch(async (e: any) => {
      Toast.show({ type: "error", text1: "Cart update failed", text2: e?.message });
      await refreshCart();
    });
  };
  const flush = () => queue.current;

  const refreshCart = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/api/cart");
      setCartItems(fromServer(data.data));
    } catch (e) {
      console.error("Error fetching cart:", e);
    }
  };

  // Logged in: push any guest items to the server cart, then load it.
  // Logged out: the cart is local only (cleared on sign-out).
  useEffect(() => {
    if (!isLoaded) return;
    const run = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const guestItems = prevToken.current ? [] : itemsRef.current;
          for (const it of guestItems) {
            await api.post("/api/cart/add", { productId: it.productId, quantity: it.quantity, size: it.size }).catch(() => {});
          }
          await refreshCart();
        } finally {
          setIsLoading(false);
        }
      } else if (prevToken.current) {
        setCartItems([]);
      }
      prevToken.current = token;
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, token]);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // ---- mutations (optimistic local update + server sync when logged in) ----

  const addToCart = (product: Product, size: string) => {
    setCartItems((prev) => {
      const existing = prev.find((it) => sameLine(it, product._id, size));
      if (existing) {
        return prev.map((it) => (it === existing ? { ...it, quantity: it.quantity + 1 } : it));
      }
      return [...prev, { id: product._id, productId: product._id, product, quantity: 1, size, price: product.price }];
    });

    if (token) {
      enqueue(async () => {
        const { data } = await api.post("/api/cart/add", { productId: product._id, quantity: 1, size });
        setCartItems(fromServer(data.data));
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number, size: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCartItems((prev) => prev.map((it) => (sameLine(it, productId, size) ? { ...it, quantity } : it)));

    if (token) {
      enqueue(async () => {
        const { data } = await api.put(`/api/cart/item/${productId}`, { quantity, size });
        setCartItems(fromServer(data.data));
      });
    }
  };

  const removeFromCart = (productId: string, size: string) => {
    setCartItems((prev) => prev.filter((it) => !sameLine(it, productId, size)));

    if (token) {
      enqueue(async () => {
        const { data } = await api.delete(`/api/cart/item/${productId}`, { params: { size } });
        setCartItems(fromServer(data.data));
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (token) {
      enqueue(async () => {
        await api.delete("/api/cart");
      });
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        flush,
        refreshCart,
        cartTotal,
        itemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
