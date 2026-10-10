import * as Keychain from 'react-native-keychain';

/**
 * Encrypted key-value storage (Android Keystore / iOS Keychain). Each key is its own entry, so the
 * auth token, the cached user and the guest wishlist can be read and cleared independently.
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const entry = await Keychain.getGenericPassword({service: key});
    return entry ? entry.password : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword(key, value, {service: key});
  },

  async removeItem(key: string): Promise<void> {
    await Keychain.resetGenericPassword({service: key});
  },

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await secureStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  setJSON(key: string, value: unknown): Promise<void> {
    return secureStorage.setItem(key, JSON.stringify(value));
  },
};
