import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import type { Product } from "@/constants/types";
import { normalizeProducts } from "@/constants/normalize";

// Base URL of the expressJs_ecommerce_backend (Express + MongoDB) backend, default PORT 3000.
// Endpoints in this app already include the `/api/...` prefix, so the base URL must NOT end with /api.
//
// 1. EXPO_PUBLIC_API_URL (mobile_ecommerce_app/.env) wins when set - use it for the deployed backend.
// 2. Otherwise, in development, use the same machine Expo is served from (port 3000), so a
//    phone on Wi-Fi keeps working when your PC's IP changes, and the web build uses its own host.
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const BACKEND_PORT = 3000;

const devHost = (): string | undefined => {
    if (Platform.OS === "web") return globalThis.location?.hostname;
    // e.g. "10.126.193.20:8081" - the PC running `expo start`
    const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    return hostUri?.split(":")[0];
};

const FALLBACK_API_URL = Platform.select({
    android: "http://10.0.2.2:3000", // Android emulator -> host localhost
    default: "http://localhost:3000",
});

const host = devHost();
const BASE_URL = ENV_API_URL || (host ? `http://${host}:${BACKEND_PORT}` : FALLBACK_API_URL);

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
