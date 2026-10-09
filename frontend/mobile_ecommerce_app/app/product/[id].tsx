import { View, Text, ActivityIndicator, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Product } from '@/constants/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import api from '@/constants/api';
import { normalizeProduct } from '@/constants/normalize';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import ProductFooter from '@/components/FooterComponent';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const { addToCart, cartItems, itemCount } = useCart();
    const { toggleWishlist, isInWishlist,  } = useWishlist();

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const fetchProduct = async () => {
        const productId = Array.isArray(id) ? id[0] : id;
        try {
            const { data } = await api.get(`/api/products/${productId}`);
            if (data?.success && data.data) {
                setProduct(normalizeProduct(data.data));
            } else {
                setProduct(null);
            }
        } catch (e) {
            console.error("Error fetching product:", e);
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView className='flex-1 justify-center items-center'>
                <ActivityIndicator size='large' color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView className='flex-1 justify-center'>
                <Text>Product not Found</Text>
            </SafeAreaView>
        );
    }

    const isLike = isInWishlist(product._id);

    const handleAddToCart = () => {
        if (product && product.sizes && product.sizes.length > 0 && !selectedSize) {
            Toast.show({
                type: 'info',
                text1: 'No Size Selected',
                text2: 'Please select a size'
            });
            return;
        }

        addToCart(product, selectedSize || "");
    };


    return (
        <View>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Image carousel */}
                <View className='related h-[450px] bg-gray-100 mb-6'>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onScroll={(e) => {
                            const index = Math.round(
                                e.nativeEvent.contentOffset.x / width
                            );
                            setActiveImageIndex(index);
                        }}
                    >
                        {product.images?.map((img, index) => (
                            <Image
                                key={index}
                                source={{ uri: img }}
                                style={{ width: width, height: 450 }}
                                resizeMode='cover'
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* header actions  */}
                <View className='absolute top-12 left-4 right-4 flex-row justify-between items-center z-10'>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className='w-10 h-10 bg-white/80 rounded-full items-center justify-center'>
                        <Ionicons name='arrow-back' size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    {/* wishlist */}
                    <TouchableOpacity
                        onPress={() => toggleWishlist(product)}
                        className='w-10 h-10 bg-white/80 rounded-full items-center justify-center'>
                        <Ionicons
                            name={isLike ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isLike ? COLORS.accent : COLORS.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* pagination dots */}
                <View className='absolute top-[420px] left-0 right-0 flex-row justify-center items-center gap-2'>
                    {product.images?.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full ${activeImageIndex === index ? 'w-4 bg-primary' : 'w-2 bg-gray-300'
                                }`}
                        />
                    ))}
                </View >

                {/* product info */}
                <View className='px-5'>
                    {/* title and rating */}
                    <View className='flex-row justify-between items-start mb-2'>
                        <Text className='text-2xl font-bold text-primary flex-1 mr-4'>
                            {product.name}
                        </Text>

                        {/* rating */}
                        <View className='flex-row items-center mb-2'>
                            <Ionicons name='star' size={14} color="#FFD700" />
                            <Text className='text-sm font-bold ml-1'>4.5</Text>
                            <Text className='text-xs text-secondary ml-1'>(85)</Text>
                        </View>
                    </View>

                    {/* price */}
                    <Text className='text-2xl font-bold text-primary mb-4'>
                        ${product.price.toFixed(2)}
                    </Text>

                    {/* sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                        <>
                            <Text className='text-base font-bold text-primary mb-3'>Size</Text>

                            <View className='flex-row gap-3 mb-6 flex-wrap'>
                                {product.sizes.map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        onPress={() => setSelectedSize(size)}
                                        className={`w-12 h-12 rounded-full items-center justify-center border 
                                                    ${selectedSize === size
                                                ? 'bg-primary border-primary'
                                                : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text
                                            className={`font-medium ${selectedSize === size ? 'text-white' : 'text-primary'
                                                }`}
                                        >
                                            {size}
                                        </Text>
                                    </TouchableOpacity>
                                ))}


                            </View>
                        </>
                    )}

                    {/* descriptoon */}
                    <Text className='text-base font-bold text-primary mb-2'>
                        Description
                    </Text>
                    <Text className='text-secondary leading-6 mb-6'>
                        {product.description}
                    </Text>

                </View>
            </ScrollView>

            {/* footer */}
            <View className="absolute bottom-0 left-0 flex-row right-0 p-4 bg-white border-t border-gray-100">
                <TouchableOpacity
                    onPress={handleAddToCart}
                    className="w-4/5 bg-primary py-4 rounded-full items-center shadow-lg flex-row justify-center"
                >
                    <Ionicons name="bag-outline" size={20} color="white" />
                    <Text className="text-white font-bold text-base ml-2">Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)/cart")}
                    className="w-1/5 py-3 flex-row justify-center relative"
                >
                    <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
                    <View className="absolute top-2 right-4 w-4 h-4  bg-black rounded-full justify-center items-center">
                        <Text className="text-white text-[9px]">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* <View>
                <ProductFooter
                    price={product.price}
                    onAddToCart={() => addToCart(product, selectedSize!)}
                    onBuyNow={() => console.log("Buy Now")}
                />
            </View> */}

        </View>
    );
}