import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {STORAGE_KEYS} from '@/constants/storageKeys';
import {ApiError, authApi, setAuthToken} from '@/services/api';
import {secureStorage} from '@/services/storage/secureStorage';
import type {User} from '@/types/models';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** False until the stored session has been restored on app start. */
  isLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Signs in and rejects accounts without the admin role. */
  adminLogin: (email: string, password: string) => Promise<void>;
  /** Permanently deletes the signed-in account, then signs out. */
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Keyboards often add a trailing space or a capital letter to emails. */
const cleanEmail = (email: string) => email.trim().toLowerCase();

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const persist = useCallback(async (nextToken: string, nextUser: User) => {
    await secureStorage.setItem(STORAGE_KEYS.authToken, nextToken);
    await secureStorage.setJSON(STORAGE_KEYS.authUser, nextUser);
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await secureStorage.removeItem(STORAGE_KEYS.authToken);
    await secureStorage.removeItem(STORAGE_KEYS.authUser);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Restore the session, then refresh the profile. An expired token (401) signs the user out.
  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await secureStorage.getItem(STORAGE_KEYS.authToken);
        if (!storedToken) {
          return;
        }
        setAuthToken(storedToken);
        setToken(storedToken);
        setUser(await secureStorage.getJSON<User>(STORAGE_KEYS.authUser));
        try {
          const freshUser = await authApi.me();
          if (freshUser) {
            await persist(storedToken, freshUser);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await signOut();
          }
        }
      } catch {
        // Unreadable keychain entry: continue as a guest.
      } finally {
        setIsLoaded(true);
      }
    };
    restore();
  }, [persist, signOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(cleanEmail(email), password);
      await persist(res.token, res.user);
    },
    [persist],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authApi.register(name.trim(), cleanEmail(email), password);
      await persist(res.token, res.user);
    },
    [persist],
  );

  const adminLogin = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(cleanEmail(email), password);
      if (res.user?.role !== 'admin') {
        throw new Error('This account is not an admin');
      }
      await persist(res.token, res.user);
    },
    [persist],
  );

  const deleteAccount = useCallback(
    async (password: string) => {
      await authApi.deleteAccount(password);
      await signOut();
    },
    [signOut],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoaded,
      isSignedIn: !!token,
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut,
      adminLogin,
      deleteAccount,
    }),
    [user, token, isLoaded, signIn, signUp, signOut, adminLogin, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
