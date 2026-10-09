import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Header from "@/components/Header";
import { COLORS, CURRENCY, DELIVERY_FEE } from "@/constants";
import type { Address } from "@/constants/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/constants/api";
import Toast from "react-native-toast-message";

// Stripe Checkout needs https success/cancel URLs. We pass these sentinel URLs and
// intercept navigation to them inside the WebView (they never actually load).
const SUCCESS_URL = "https://ecommerce-mobile.local/payment-success";
const CANCEL_URL = "https://ecommerce-mobile.local/payment-cancel";

type AddressForm = {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

const EMPTY_ADDRESS: AddressForm = {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
};

export default function Checkout() {
    const router = useRouter();
    const { cartTotal, cartItems, clearCart, flush, refreshCart } = useCart();
    const { isSignedIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
    const [hasSavedAddress, setHasSavedAddress] = useState(false);
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "stripe">("cash");

    // Stripe WebView gateway state
    const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);

    const shipping = cartTotal === 0 ? 0 : DELIVERY_FEE;
    const tax = 0;
    const total = cartTotal + shipping + tax;

    const set = (key: keyof AddressForm, value: string) => setAddress((prev) => ({ ...prev, [key]: value }));

    const addressValid = address.street && address.city && address.state && address.zipCode && address.country;

    // Prefill with the user's default saved address (GET /api/addresses, default first)
    useEffect(() => {
        if (!isSignedIn) return;
        api.get("/api/addresses")
            .then(({ data }) => {
                const saved: Address | undefined = data?.data?.[0];
                if (saved) {
                    const { street, city, state, zipCode, country } = saved;
                    setAddress({ street, city, state, zipCode, country });
                    setHasSavedAddress(true);
                }
            })
            .catch(() => {});
    }, [isSignedIn]);

    // First order: remember the address for next time
    const saveAddressIfNew = async () => {
        if (hasSavedAddress) return;
        await api.post("/api/addresses", { type: "Home", ...address, isDefault: true }).catch(() => {});
        setHasSavedAddress(true);
    };

    // Stripe returns to SUCCESS_URL / CANCEL_URL. The webhook (POST /api/stripe) marks the
    // order paid and clears the server cart; we clear the local cart on success too.
    const handleGatewayNavigation = (url: string): boolean => {
        if (url.startsWith(SUCCESS_URL)) {
            setGatewayUrl(null);
            clearCart();
            Toast.show({ type: "success", text1: "Payment successful", text2: "Your order is confirmed" });
            router.replace("/orders");
            return false;
        }
        if (url.startsWith(CANCEL_URL)) {
            setGatewayUrl(null);
            refreshCart();
            Toast.show({ type: "error", text1: "Payment cancelled", text2: "Your order is awaiting payment" });
            router.replace("/orders");
            return false;
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        if (!isSignedIn) {
            Toast.show({ type: "error", text1: "Login required", text2: "Please sign in to place an order" });
            router.push("/sign-in");
            return;
        }
        if (cartItems.length === 0) {
            Toast.show({ type: "error", text1: "Cart empty", text2: "Add items before checking out" });
            return;
        }
        if (!addressValid) {
            Toast.show({ type: "error", text1: "Address required", text2: "Please fill in all address fields" });
            return;
        }

        setLoading(true);
        try {
            // The order is built from the server cart, so wait for pending cart updates first
            await flush();

            // POST /api/orders -> creates the order from the cart and reduces stock.
            // For cash orders the server clears the cart; for stripe it's cleared by the webhook.
            const { data } = await api.post("/api/orders", { shippingAddress: address, paymentMethod, notes });
            const order = data.data;
            await saveAddressIfNew();

            if (paymentMethod === "stripe") {
                // POST /api/payments/checkout-session -> { id, url }
                const session = await api.post("/api/payments/checkout-session", {
                    items: cartItems.map((it) => ({
                        product: { name: it.product.name, images: it.product.images },
                        price: it.price,
                        quantity: it.quantity,
                    })),
                    shipping: order.shippingCost,
                    orderId: order._id,
                    success_url: SUCCESS_URL,
                    cancel_url: CANCEL_URL,
                });
                if (!session.data?.url) throw new Error(session.data?.error || "Could not start payment");
                setGatewayUrl(session.data.url);
                return;
            }

            clearCart();
            Toast.show({ type: "success", text1: "Order placed", text2: `Order #${order.orderNumber}` });
            router.replace("/orders");
        } catch (e: any) {
            Toast.show({ type: "error", text1: "Order failed", text2: e?.message ?? "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    const field = (label: string, value: string, k: keyof AddressForm, keyboardType?: any) => (
        <View className="mb-3">
            <Text className="text-secondary text-xs mb-1">{label}</Text>
            <TextInput
                className="bg-white px-4 py-3 rounded-xl border border-gray-100 text-primary"
                value={value}
                onChangeText={(t) => set(k, t)}
                keyboardType={keyboardType}
                placeholderTextColor="#999"
            />
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Checkout" showBack />

            <ScrollView className="flex-1 px-4 mt-4" keyboardShouldPersistTaps="handled">
                {/* Address Section */}
                <Text className="text-lg font-bold text-primary mb-4">Shipping Address</Text>
                {field("Street", address.street, "street")}
                <View className="flex-row gap-3">
                    <View className="flex-1">{field("City", address.city, "city")}</View>
                    <View className="flex-1">{field("State", address.state, "state")}</View>
                </View>
                <View className="flex-row gap-3">
                    <View className="flex-1">{field("Zip Code", address.zipCode, "zipCode", "numeric")}</View>
                    <View className="flex-1">{field("Country", address.country, "country")}</View>
                </View>

                <View className="mb-3">
                    <Text className="text-secondary text-xs mb-1">Delivery notes (optional)</Text>
                    <TextInput
                        className="bg-white px-4 py-3 rounded-xl border border-gray-100 text-primary"
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="e.g. Leave at the front door"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Payment Section */}
                <Text className="text-lg font-bold text-primary mb-4 mt-2">Payment Method</Text>

                <TouchableOpacity
                    onPress={() => setPaymentMethod("cash")}
                    className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === "cash" ? "border-primary" : "border-transparent"}`}
                >
                    <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
                    <View className="ml-3 flex-1">
                        <Text className="text-base font-bold text-primary">Cash on Delivery</Text>
                        <Text className="text-secondary text-xs mt-1">Pay when you receive the order</Text>
                    </View>
                    {paymentMethod === "cash" && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setPaymentMethod("stripe")}
                    className={`bg-white p-4 rounded-xl mb-6 shadow-sm flex-row items-center border-2 ${paymentMethod === "stripe" ? "border-primary" : "border-transparent"}`}
                >
                    <Ionicons name="card-outline" size={24} color={COLORS.primary} />
                    <View className="ml-3 flex-1">
                        <Text className="text-base font-bold text-primary">Pay with Card</Text>
                        <Text className="text-secondary text-xs mt-1">Credit or Debit Card</Text>
                    </View>
                    {paymentMethod === "stripe" && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                </TouchableOpacity>
            </ScrollView>

            <View className="p-4 bg-white shadow-lg border-t border-gray-100">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-secondary">Subtotal</Text>
                    <Text className="font-bold">{CURRENCY}{cartTotal.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-secondary">Shipping</Text>
                    <Text className="font-bold">{CURRENCY}{shipping.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-4">
                    <Text className="text-xl font-bold text-primary">Total</Text>
                    <Text className="text-xl font-bold text-primary">{CURRENCY}{total.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={loading}
                    className={`p-4 rounded-xl items-center ${loading ? "bg-gray-400" : "bg-primary"}`}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Place Order</Text>}
                </TouchableOpacity>
            </View>

            {/* Stripe Checkout gateway */}
            <Modal visible={!!gatewayUrl} animationType="slide" onRequestClose={() => setGatewayUrl(null)}>
                <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-primary">Secure Payment</Text>
                        <TouchableOpacity onPress={() => handleGatewayNavigation(CANCEL_URL)}>
                            <Ionicons name="close" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    {gatewayUrl && (
                        <WebView
                            source={{ uri: gatewayUrl }}
                            onShouldStartLoadWithRequest={(req) => handleGatewayNavigation(req.url)}
                            startInLoadingState
                            renderLoading={() => (
                                <View className="absolute inset-0 justify-center items-center bg-white">
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
