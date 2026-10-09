import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants";

type Props = {
    value: string;
    onChangeText: (text: string) => void;
    className?: string;
};

// Password field with a show/hide toggle. Auto-capitalise and autocorrect are off so the
// keyboard can't silently change what the user typed.
export default function PasswordInput({ value, onChangeText, className = "" }: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <View className={`w-full bg-surface rounded-xl flex-row items-center ${className}`}>
            <TextInput
                className="flex-1 p-4 text-primary"
                placeholder="********"
                placeholderTextColor="#999"
                secureTextEntry={!visible}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textContentType="password"
                autoComplete="password"
                value={value}
                onChangeText={onChangeText}
            />
            <TouchableOpacity onPress={() => setVisible((v) => !v)} className="px-4" accessibilityLabel={visible ? "Hide password" : "Show password"}>
                <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.secondary} />
            </TouchableOpacity>
        </View>
    );
}
