import React, {useState} from 'react';
import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import FormField from '@/components/common/FormField';
import {Text} from '@/components/ui/Typography';
import {colors} from '@/theme';
import {getErrorMessage} from '@/utils/errors';

interface ConfirmActionCardProps {
  title: string;
  message?: string;
  confirmLabel: string;
  danger?: boolean;
  /** Ask for the account password (delete account). */
  needPassword?: boolean;
  disabled: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

/** Yes/No card for actions the user must confirm: clear cart, delete address, sign out, delete account. */
export default function ConfirmActionCard({
  title,
  message,
  confirmLabel,
  danger = false,
  needPassword = false,
  disabled,
  onConfirm,
  onCancel,
}: ConfirmActionCardProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = busy || (needPassword && !password);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(password);
    } catch (e) {
      setError(getErrorMessage(e, 'Something went wrong'));
      setBusy(false);
    }
  };

  return (
    <View
      className={`rounded-2xl border bg-background p-4 ${
        danger ? 'border-red-200' : 'border-border'
      }`}>
      <Text className={`mb-1 text-base font-bold ${danger ? 'text-error' : 'text-primary'}`}>
        {title}
      </Text>
      {!!message && <Text className="mb-3 text-xs text-secondary">{message}</Text>}
      {needPassword && !disabled && (
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          placeholder="Enter your password to confirm"
          containerClassName="mb-3"
        />
      )}
      {!!error && <Text className="mb-2 text-xs text-error">{error}</Text>}
      {!disabled && (
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 items-center justify-center rounded-xl border border-border py-3">
            <Text className="font-semibold text-primary">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirm}
            disabled={blocked}
            accessibilityRole="button"
            className={`flex-1 items-center justify-center rounded-xl py-3 ${
              blocked ? 'bg-gray-300' : danger ? 'bg-red-600' : 'bg-primary'
            }`}>
            {busy ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="font-semibold text-white">{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
