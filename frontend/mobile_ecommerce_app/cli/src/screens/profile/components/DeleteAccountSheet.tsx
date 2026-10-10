import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, View} from 'react-native';
import PasswordInput from '@/components/common/PasswordInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import {Ionicons} from '@/components/icons';
import {Text} from '@/components/ui/Typography';
import {colors} from '@/theme';

interface DeleteAccountSheetProps {
  visible: boolean;
  deleting: boolean;
  onConfirm: (password: string) => void;
  onClose: () => void;
}

/** Bottom sheet that explains what is deleted and asks for the password (Google Play requirement). */
export default function DeleteAccountSheet({
  visible,
  deleting,
  onConfirm,
  onClose,
}: DeleteAccountSheetProps) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setPassword('');
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
          <Pressable className="rounded-t-3xl bg-background p-6">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="trash-outline" size={26} color={colors.error} />
            </View>
            <Text className="mb-2 text-xl font-bold text-primary">Delete your account?</Text>
            <Text className="mb-1 text-secondary">
              This permanently deletes your account, saved addresses, cart and wishlist.
            </Text>
            <Text className="mb-5 text-secondary">
              Order records are kept only as long as tax law requires. This can't be undone.
            </Text>

            <Text className="mb-1 text-xs font-bold uppercase text-secondary">
              Enter your password to confirm
            </Text>
            <PasswordInput value={password} onChangeText={setPassword} className="mb-5" />

            <PrimaryButton
              title="Delete Account"
              loading={deleting}
              disabled={!password}
              onPress={() => onConfirm(password)}
              className={password && !deleting ? '!bg-error' : ''}
            />
            <Pressable onPress={onClose} className="mt-3 items-center p-3" disabled={deleting}>
              <Text className="font-medium text-primary">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
