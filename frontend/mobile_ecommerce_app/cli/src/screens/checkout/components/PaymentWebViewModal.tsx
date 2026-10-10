import React from 'react';
import {Modal, TouchableOpacity, View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import LoadingView from '@/components/common/LoadingView';
import {Ionicons} from '@/components/icons';
import {colors} from '@/theme';

/**
 * Stripe Checkout requires https return URLs. These sentinels are intercepted inside the WebView
 * and never actually load.
 */
export const PAYMENT_SUCCESS_URL = 'https://ecommerce-mobile.local/payment-success';
export const PAYMENT_CANCEL_URL = 'https://ecommerce-mobile.local/payment-cancel';

interface PaymentWebViewModalProps {
  url: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentWebViewModal({url, onSuccess, onCancel}: PaymentWebViewModalProps) {
  const handleNavigation = (next: string): boolean => {
    if (next.startsWith(PAYMENT_SUCCESS_URL)) {
      onSuccess();
      return false;
    }
    if (next.startsWith(PAYMENT_CANCEL_URL)) {
      onCancel();
      return false;
    }
    return true;
  };

  return (
    <Modal visible={!!url} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between border-b border-border p-4">
          <Text className="text-lg font-bold text-primary">Secure Payment</Text>
          <TouchableOpacity onPress={onCancel} accessibilityLabel="Cancel payment">
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {!!url && (
          <WebView
            source={{uri: url}}
            onShouldStartLoadWithRequest={request => handleNavigation(request.url)}
            startInLoadingState
            renderLoading={() => <LoadingView className="absolute inset-0 bg-background" />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
