import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { BANNERS } from "@/assets/assets";
import { CATEGORIES } from "@/constants";
import CategoryItem from "@/components/CategoryItem";
import { router } from "expo-router";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/constants/types";
import api from "@/constants/api";
import { normalizeProducts } from "@/constants/normalize";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([])
  const[loading, setLoading] = useState(true);

  // to load the products from the web backend
  const fetchProducts = async()=>{
      try {
        const { data } = await api.get("/api/product/list");
        if (data?.success) setProducts(normalizeProducts(data.products));
      } catch (e) {
        console.error("Error fetching products:", e);
      } finally {
        setLoading(false);
      }
  }

  useEffect(()=>{
    fetchProducts()
  }, []);

  const categories = [
    { id: "all", name: "All", icon: "grid" },
    ...CATEGORIES,
  ];

  // Mirror the web home: Latest Collection (newest) + Best Seller (bestseller).
  const latestProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const bestSellers = products.filter((p) => p.isFeatured).slice(0, 6);

  const ITEM_WIDTH = width - 32;

  const handleScroll = (event) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / ITEM_WIDTH
    );
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Forever" showCart showMenu showLogo />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= Banner Slider ================= */}
        <View style={{ marginTop: 12 }}>
          <ScrollView
            horizontal
            pagingEnabled
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {BANNERS.map((banner, index) => (
              <View
                key={index}
                style={{
                  width: ITEM_WIDTH,
                  height: 180,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginRight: 8,
                  backgroundColor: "#eee",
                }}
              >
                <Image
                  source={{ uri: banner.image }}
                  style={{ width: "100%", height: "100%" }}
                />

                {/* Overlay */}
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.35)",
                  }}
                />

                {/* Text */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 14,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    {banner.title}
                  </Text>

                  <Text style={{ color: "#fff", fontSize: 13 }}>
                    {banner.subtitle}
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push("/shop")}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#fff",
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 20,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ fontWeight: "bold", fontSize: 12 }}>
                      Shop Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 10,
            }}
          >
            {BANNERS.map((_, index) => (
              <View
                key={index}
                style={{
                  height: 6,
                  width: activeIndex === index ? 18 : 6,
                  borderRadius: 3,
                  marginHorizontal: 3,
                  backgroundColor:
                    activeIndex === index ? "#000" : "#ccc",
                }}
              />
            ))}
          </View>
        </View>

        {/* ================= Categories ================= */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Categories
          </Text>

          <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 10,
            paddingRight: 20,
            alignItems: "center",
          }}
        >
            {categories.map((cat) => (
              <CategoryItem
                key={cat.id}
                item={cat}
                isSelected={false}
                onPress={() =>
                  router.push({
                    pathname: "/shop",
                    params: {
                      category: cat.id === "all" ? "" : cat.name,
                    },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* ================= Latest Collection ================= */}
        <View className="mb-4">
          <View className="mt-8 mb-6 px-2 py-2 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-primary">
                Latest Collection
              </Text>

              <TouchableOpacity onPress={() => router.push('/shop')}>
                <Text className="text-sm text-secondary font-medium">
                  See All
                </Text>
              </TouchableOpacity>
          </View>

          {loading ? (
              <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : latestProducts.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                No products found
              </Text>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {latestProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </View>
            )
          }
        </View>

        {/* ================= Best Seller ================= */}
        {!loading && bestSellers.length > 0 && (
          <View className="mb-8">
            <View className="mb-6 px-2 py-2 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-primary">Best Seller</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {bestSellers.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          </View>
        )}

       {/* newsletter CTA */}
        <View className="bg-gray-100 p-6 rounded-2xl mb-20 items-center">

          <Text className="text-2xl font-bold text-primary mb-2 text-center">
            Join the Revolution
          </Text>

          <Text className="text-secondary text-center mb-4">
            Subscribe to our newsletter and get 10% off your first purchase.
          </Text>

          {/* FIXED BUTTON */}
          <TouchableOpacity
            onPress={() =>
              Toast.show({ type: "success", text1: "Subscribed!", text2: "Thanks for joining our newsletter." })
            }
            className="bg-primary w-full py-3 rounded-full items-center"
          >
            <Text className=" text-white font-medium text-base">
              Subscribe Now
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}