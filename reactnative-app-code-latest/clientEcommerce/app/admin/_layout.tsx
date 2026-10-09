import { Tabs, useRouter } from "expo-router";
import React, { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity, Text, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import PasswordInput from "@/components/PasswordInput";
import Toast from "react-native-toast-message";

export default function AdminLayout() {
    const { isAdmin, adminLogin, isLoaded } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isLoaded) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Gate the admin panel: only users with role "admin" (e.g. ADMIN_EMAIL from the backend .env)
    if (!isAdmin) {
        const onLogin = async () => {
            if (!email || !password) return;
            setLoading(true);
            try {
                await adminLogin(email, password);
            } catch (e: any) {
                Toast.show({ type: "error", text1: "Login failed", text2: e?.message ?? "Invalid credentials" });
            } finally {
                setLoading(false);
            }
        };

        return (
            <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
                <View className="flex-row items-center p-4">
                    <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1 justify-center px-7"
                >
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-primary mb-2">Admin Panel</Text>
                        <Text className="text-secondary text-center">Sign in with an admin account</Text>
                    </View>

                    <Text className="text-primary font-medium mb-2">Email</Text>
                    <TextInput
                        className="w-full bg-surface p-4 rounded-xl text-primary mb-4"
                        placeholder="admin@example.com"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text className="text-primary font-medium mb-2">Password</Text>
                    <PasswordInput value={password} onChangeText={setPassword} className="mb-6" />

                    <TouchableOpacity
                        onPress={onLogin}
                        disabled={loading || !email || !password}
                        className={`w-full py-4 rounded-full items-center ${loading || !email || !password ? "bg-gray-300" : "bg-primary"}`}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Login</Text>}
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: "gray",
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.replace("/(tabs)")}
                        className="mr-4 flex-row items-center"
                    >
                        <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
                        <Text className="ml-1 text-primary font-medium">Exit</Text>
                    </TouchableOpacity>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
            />
            <Tabs.Screen
                name="products"
                options={{ title: "Products", tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }}
            />
            <Tabs.Screen
                name="orders"
                options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} /> }}
            />
        </Tabs>
    );
}
