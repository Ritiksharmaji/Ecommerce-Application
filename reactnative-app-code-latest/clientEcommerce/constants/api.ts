import axios from "axios";
import { Platform } from "react-native";
import type { Product } from "@/constants/types";
import { normalizeProducts } from "@/constants/normalize";

// Base URL of the ServerECommerce (Express + MongoDB) backend, default PORT 3000.
// Endpoints in this app already include the `/api/...` prefix, so the base URL must NOT end with /api.
//
// On a physical phone (Expo Go), localhost points at the PHONE, not your PC.
// Set EXPO_PUBLIC_API_URL in clientEcommerce/.env to your PC's LAN IP, e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.0.55:3000
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

const FALLBACK_API_URL = Platform.select({
    android: "http://10.0.2.2:3000", // Android emulator -> host localhost
    ios: "http://localhost:3000", // iOS simulator
    default: "http://localhost:3000",
});

const BASE_URL = ENV_API_URL ?? FALLBACK_API_URL;

const api = axios.create({ baseURL: BASE_URL });

// The backend authenticates with `Authorization: Bearer <jwt>`.
// AuthContext sets/clears this default header on login/logout/restore.
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

// The backend returns errors as non-2xx `{ success:false, message }`. Surface that
// message so screens can show it with `e.message`.
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
        return Promise.reject(Object.assign(new Error(message), { status: error?.response?.status }));
    }
);

// GET /api/products is paginated; fetch a large page to get the whole catalogue.
export const fetchAllProducts = async (): Promise<Product[]> => {
    const { data } = await api.get("/api/products", { params: { page: 1, limit: 1000 } });
    return data?.success ? normalizeProducts(data.data) : [];
};

export default api;
