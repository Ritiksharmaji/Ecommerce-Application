import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store has no web implementation, so the web build uses localStorage.
const isWeb = Platform.OS === "web";

export const storage = {
    getItem: async (key: string): Promise<string | null> =>
        isWeb ? globalThis.localStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key),

    setItem: async (key: string, value: string): Promise<void> =>
        isWeb ? globalThis.localStorage?.setItem(key, value) : SecureStore.setItemAsync(key, value),

    removeItem: async (key: string): Promise<void> =>
        isWeb ? globalThis.localStorage?.removeItem(key) : SecureStore.deleteItemAsync(key),
};
