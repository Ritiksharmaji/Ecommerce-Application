import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants";
import { useWishlist } from "@/context/WishlistContext";

export default function ProductCard({ product }) {
  const{toggleWishlist, isInWishlist} = useWishlist();
  const isLiked = isInWishlist(product._id);

  return (
    <Link href={`/product/${product._id}`} asChild>
      <TouchableOpacity
        style={{
          width: "48%",
          marginBottom: 16,
          backgroundColor: "#fff",
          borderRadius: 16,
          overflow: "hidden",

          // Shadow (important for premium UI)
          shadowColor: "#000",
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {/* Image Section */}
        <View
          style={{
            height: 200,
            width: "100%",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Image
            source={{
              uri:
                product?.images?.[0] ||
                "https://via.placeholder.com/300",
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* ❤️ Wishlist */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              padding: 8,
              backgroundColor: "#fff",
              borderRadius: 50,
            }} onPress={(e)=>{e.stopPropagation(); toggleWishlist(product)}}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={18}
              color={isLiked ? COLORS.accent : COLORS.primary}
            />
          </TouchableOpacity>

          {/* ⭐ Featured Tag */}
          {product?.isFeatured && (
            <View
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                backgroundColor: "#000",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                FEATURED
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={{ padding: 12 }}>
          {/* ⭐ Rating */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text
              style={{
                fontSize: 12,
                color: "#666",
                marginLeft: 4,
              }}
            >
              {product?.ratings?.average || 4.5}
            </Text>
          </View>

          {/* Product Name */}
          <Text
            numberOfLines={2}
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111",
              marginBottom: 6,
            }}
          >
            {product?.name}
          </Text>

          {/* Price Section */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#000",
              }}
            >
              ${product?.price?.toFixed(2)}
            </Text>

            {product?.comparePrice && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#999",
                  marginLeft: 6,
                  textDecorationLine: "line-through",
                }}
              >
                ${product.comparePrice.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}