import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { COLORS } from "@/constants";

type Props = {
  price: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
};

export default function ProductFooter({
  price,
  onAddToCart,
  onBuyNow,
}: Props) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-200 flex-row items-center justify-between">
      
      {/* Price */}
      <View>
        <Text className="text-xs text-gray-500">Price</Text>
        <Text className="text-xl font-bold text-primary">
          ${price.toFixed(2)}
        </Text>
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3">
        
        {/* Add to Cart */}
        <TouchableOpacity
          onPress={onAddToCart}
          className="px-4 py-3 rounded-xl border border-primary"
        >
          <Text className="text-primary font-semibold">
            Add
          </Text>
        </TouchableOpacity>

        {/* Buy Now */}
        <TouchableOpacity
          onPress={onBuyNow}
          className="px-6 py-3 rounded-xl bg-primary"
        >
          <Text className="text-white font-semibold">
            Buy Now
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}