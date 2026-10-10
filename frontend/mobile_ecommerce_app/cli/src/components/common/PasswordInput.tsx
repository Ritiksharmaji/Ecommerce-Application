import React, {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {TextInput} from '@/components/ui/Typography';
import {Ionicons} from '@/components/icons';
import {colors} from '@/theme';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  className?: string;
}

/** Password field with show/hide toggle; autocorrect is off so the keyboard can't alter input. */
export default function PasswordInput({value, onChangeText, className = ''}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className={`w-full flex-row items-center rounded-xl bg-surface ${className}`}>
      <TextInput
        className="flex-1 p-4 text-primary"
        placeholder="********"
        placeholderTextColor={colors.muted}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType="password"
        autoComplete="password"
        accessibilityLabel="Password"
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity
        onPress={() => setVisible(v => !v)}
        className="px-4"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.secondary}
        />
      </TouchableOpacity>
    </View>
  );
}
