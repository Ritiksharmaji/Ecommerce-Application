import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { CATEGORIES, COLORS } from "@/constants";
import api from "@/constants/api";
import { normalizeProduct } from "@/constants/normalize";

// Edit Product -> PUT /api/products/:id (multipart). Kept images are sent as `existingImages`,
// newly picked ones as `images` files (uploaded to Cloudinary by the backend).
export default function EditProduct() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const productId = Array.isArray(id) ? id[0] : id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [comparePrice, setComparePrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("Men");
    const [sizes, setSizes] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/api/products/${productId}`);
                const p = normalizeProduct(data.data);
                setName(p.name);
                setDescription(p.description);
                setPrice(String(p.price));
                setComparePrice(p.comparePrice != null ? String(p.comparePrice) : "");
                setStock(String(p.stock));
                setCategory(typeof p.category === "string" ? p.category : p.category.name);
                setSizes((p.sizes ?? []).join(", "));
                setIsFeatured(p.isFeatured);
                setExistingImages(p.images);
            } catch (e: any) {
                Toast.show({ type: "error", text1: "Could not load product", text2: e?.message });
                router.replace("/admin/products");
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const pickImages = async () => {
        const remaining = 5 - existingImages.length;
        if (remaining <= 0) {
            Toast.show({ type: "info", text1: "Max 5 images", text2: "Remove an image first" });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.8,
        });
        if (!result.canceled) setNewImages(result.assets.map((a) => a.uri).slice(0, remaining));
    };

    const handleSubmit = async () => {
        if (!name || !description || !price || !stock) {
            Toast.show({ type: "error", text1: "Missing Fields", text2: "Please fill in all required fields" });
            return;
        }
        if (existingImages.length + newImages.length === 0) {
            Toast.show({ type: "error", text1: "Image required", text2: "Keep or add at least one image" });
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            if (comparePrice) formData.append("comparePrice", comparePrice);
            formData.append("stock", stock);
            formData.append("category", category);
            formData.append("isFeatured", isFeatured ? "true" : "false");
            formData.append("sizes", JSON.stringify(sizes.split(",").map((s) => s.trim()).filter(Boolean)));
            existingImages.forEach((url) => formData.append("existingImages", url));
            newImages.forEach((uri, i) => {
                formData.append("images", { uri, name: `image${i + 1}.jpg`, type: "image/jpeg" } as any);
            });

            await api.put(`/api/products/${productId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Toast.show({ type: "success", text1: "Product updated" });
            router.replace("/admin/products");
        } catch (e: any) {
            Toast.show({ type: "error", text1: "Update failed", text2: e?.message ?? "Something went wrong" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const input = (label: string, value: string, onChange: (t: string) => void, props: any = {}) => (
        <>
            <Text className="text-secondary text-xs font-bold mb-1 uppercase">{label}</Text>
            <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={value} onChangeText={onChange} {...props} />
        </>
    );

    return (
        <ScrollView className="flex-1 bg-surface p-4" keyboardShouldPersistTaps="handled">
            <View className="bg-white p-4 rounded-xl shadow-sm mb-20">
                {input("Product Name *", name, setName)}
                {input("Price ($) *", price, setPrice, { keyboardType: "decimal-pad" })}
                {input("Compare Price ($)", comparePrice, setComparePrice, { keyboardType: "decimal-pad", placeholder: "Original price (optional)" })}
                {input("Stock *", stock, setStock, { keyboardType: "number-pad" })}

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Category</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                    {CATEGORIES.map((c) => (
                        <TouchableOpacity
                            key={c.id}
                            onPress={() => setCategory(c.name)}
                            className={`px-4 py-2 rounded-full border ${category === c.name ? "bg-primary border-primary" : "bg-surface border-gray-200"}`}
                        >
                            <Text className={category === c.name ? "text-white" : "text-primary"}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {input("Sizes (comma separated)", sizes, setSizes, { placeholder: "e.g. S, M, L, XL" })}

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Images (max 5)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {existingImages.map((uri) => (
                        <View key={uri} className="mr-2">
                            <Image source={{ uri }} className="w-28 h-28 rounded-lg" />
                            <TouchableOpacity
                                onPress={() => setExistingImages((prev) => prev.filter((u) => u !== uri))}
                                className="absolute top-1 right-1 bg-white rounded-full p-1"
                            >
                                <Ionicons name="close" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {newImages.map((uri) => (
                        <Image key={uri} source={{ uri }} className="w-28 h-28 rounded-lg mr-2 opacity-80" />
                    ))}
                    <TouchableOpacity
                        onPress={pickImages}
                        className="w-28 h-28 rounded-lg bg-gray-100 justify-center items-center border border-dashed border-gray-300"
                    >
                        <Ionicons name="add" size={28} color={COLORS.secondary} />
                        <Text className="text-secondary text-xs mt-1">Add images</Text>
                    </TouchableOpacity>
                </ScrollView>

                {input("Description *", description, setDescription, { multiline: true, style: { height: 96, textAlignVertical: "top" } })}

                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-primary font-bold">Featured Product</Text>
                    <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: "#eee", true: COLORS.primary }} />
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`bg-primary p-4 rounded-xl items-center ${submitting ? "opacity-70" : ""}`}
                >
                    {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
