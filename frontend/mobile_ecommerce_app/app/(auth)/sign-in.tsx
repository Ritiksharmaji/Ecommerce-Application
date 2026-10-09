import { COLORS } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import PasswordInput from "@/components/PasswordInput";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, TextInput, View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SignInPage() {
    const { signIn } = useAuth();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const onSignInPress = async () => {
        if (!emailAddress || !password) return;
        setLoading(true);
        try {
            await signIn(emailAddress, password);
            router.replace("/");
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Sign In Failed",
                text2: err?.message ?? "Invalid credentials",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white justify-center" style={{ padding: 28 }}>
            <TouchableOpacity onPress={() => router.push("/")} className="absolute top-12 z-10">
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Header */}
            <View className="items-center mb-8">
                <Text className="text-3xl font-bold text-primary mb-2">Welcome Back</Text>
                <Text className="text-secondary">Sign in to continue</Text>
            </View>

            {/* Email */}
            <View className="mb-4">
                <Text className="text-primary font-medium mb-2">Email</Text>
                <TextInput
                    className="w-full bg-surface p-4 rounded-xl text-primary"
                    placeholder="user@example.com"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                />
            </View>

            {/* Password */}
            <View className="mb-6">
                <Text className="text-primary font-medium mb-2">Password</Text>
                <PasswordInput value={password} onChangeText={setPassword} />
            </View>

            {/* Submit */}
            <Pressable
                className={`w-full py-4 rounded-full items-center mb-10 ${loading || !emailAddress || !password ? "bg-gray-300" : "bg-primary"}`}
                onPress={onSignInPress}
                disabled={loading || !emailAddress || !password}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Sign In</Text>}
            </Pressable>

            {/* Footer */}
            <View className="flex-row justify-center">
                <Text className="text-secondary">Don&apos;t have an account? </Text>
                <Link href="/sign-up">
                    <Text className="text-primary font-bold">Sign up</Text>
                </Link>
            </View>
        </SafeAreaView>
    );
}
