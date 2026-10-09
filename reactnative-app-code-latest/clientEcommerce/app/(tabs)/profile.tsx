import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS, PROFILE_MENU } from "@/constants";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
    const router = useRouter();
    const { user, signOut, isAdmin } = useAuth();
    const menu = PROFILE_MENU.filter((item) => !item.adminOnly || isAdmin);

    const handleLogout = async () => {
        await signOut();
        router.replace("/sign-in");
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Profile" />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={!user ? { flex: 1, justifyContent: "center", alignItems: "center" } : { paddingTop: 16 }}
            >
                {!user ? (
                    <View className="items-center w-full">
                        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-6">
                            <Ionicons name="person" size={40} color={COLORS.secondary} />
                        </View>
                        <Text className="text-primary font-bold text-xl mb-2">Guest User</Text>
                        <Text className="text-secondary text-base mb-8 text-center w-3/4 px-4">
                            Log in to view your profile and orders.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/sign-in")}
                            className="bg-primary w-3/5 py-3 rounded-full items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-lg">Login / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Profile Info */}
                        <View className="items-center mb-8">
                            <View className="mb-3">
                                <View className="size-20 rounded-full bg-gray-200 items-center justify-center border-2 border-white">
                                    <Ionicons name="person" size={36} color={COLORS.secondary} />
                                </View>
                            </View>
                            <Text className="text-xl font-bold text-primary">{user.name}</Text>
                            <Text className="text-secondary text-sm">{user.email}</Text>
                        </View>

                        {/* Menu */}
                        <View className="bg-white rounded-xl border border-gray-100/75 p-2 mb-4">
                            {menu.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => router.push(item.route as any)}
                                    className={`flex-row items-center p-4 ${index !== menu.length - 1 ? "border-b border-gray-100" : ""}`}
                                >
                                    <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-4">
                                        <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                                    </View>
                                    <Text className="flex-1 text-primary font-medium">{item.title}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity className="flex-row items-center justify-center p-4" onPress={handleLogout}>
                            <Text className="text-red-500 font-bold ml-2">Log Out</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
