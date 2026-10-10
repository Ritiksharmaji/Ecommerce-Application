import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants";

export default function CategoryItem({ item, isSelected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center mr-5" 
    >
      <View
        className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
          isSelected ? "bg-primary" : "bg-surface"
        }`}
      >
        <Ionicons
          name={item.icon}
          size={26}
          color={isSelected ? "#FFF" : COLORS.primary}
        />
      </View>

      <Text
        className={`text-xs font-medium text-center ${
          isSelected ? "text-primary" : "text-secondary"
        }`}
        numberOfLines={1}
        style={{ width: 60 }} 
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}