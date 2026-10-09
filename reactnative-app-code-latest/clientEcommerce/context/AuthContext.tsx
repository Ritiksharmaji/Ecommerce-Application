import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { storage } from "@/constants/storage";
import api, { setAuthToken } from "@/constants/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type AuthUser = {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    image?: string;
};

type AuthContextType = {
    user: AuthUser | null;
    token: string | null;
    isLoaded: boolean;
    isSignedIn: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    // Admins are normal users with role "admin"; this signs in and rejects non-admin accounts.
    adminLogin: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const clear = async () => {
        await storage.removeItem(TOKEN_KEY);
        await storage.removeItem(USER_KEY);
        setAuthToken(null);
        setToken(null);
        setUser(null);
    };

    const persist = async (t: string, u: AuthUser) => {
        await storage.setItem(TOKEN_KEY, t);
        await storage.setItem(USER_KEY, JSON.stringify(u));
        setAuthToken(t);
        setToken(t);
        setUser(u);
    };

    // Restore session on app start, then refresh the profile from GET /api/auth/me.
    // An expired/invalid token (401) signs the user out.
    useEffect(() => {
        const restore = async () => {
            try {
                const storedToken = await storage.getItem(TOKEN_KEY);
                const storedUser = await storage.getItem(USER_KEY);
                if (storedToken) {
                    setAuthToken(storedToken);
                    setToken(storedToken);
                    setUser(storedUser ? JSON.parse(storedUser) : null);
                    try {
                        const { data } = await api.get("/api/auth/me");
                        if (data?.user) await persist(storedToken, data.user);
                    } catch (e: any) {
                        if (e?.status === 401) await clear();
                    }
                }
            } catch {
                // ignore corrupt state
            } finally {
                setIsLoaded(true);
            }
        };
        restore();
    }, []);

    // Keyboards often add a trailing space or capital letter to emails
    const cleanEmail = (email: string) => email.trim().toLowerCase();

    // POST /api/auth/login  ->  { success, token, user }
    const signIn = async (email: string, password: string) => {
        const { data } = await api.post("/api/auth/login", { email: cleanEmail(email), password });
        await persist(data.token, data.user);
    };

    // POST /api/auth/register  ->  { success, token, user }
    const signUp = async (name: string, email: string, password: string) => {
        const { data } = await api.post("/api/auth/register", { name: name.trim(), email: cleanEmail(email), password });
        await persist(data.token, data.user);
    };

    const signOut = clear;

    const adminLogin = async (email: string, password: string) => {
        const { data } = await api.post("/api/auth/login", { email: cleanEmail(email), password });
        if (data?.user?.role !== "admin") throw new Error("This account is not an admin");
        await persist(data.token, data.user);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoaded,
                isSignedIn: !!token,
                isAdmin: user?.role === "admin",
                signIn,
                signUp,
                signOut,
                adminLogin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
