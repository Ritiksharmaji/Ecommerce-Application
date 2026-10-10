import React from 'react';
import {View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import type {ToastConfig, ToastConfigParams} from 'react-native-toast-message';
import {Ionicons, type IconName} from '@/components/icons';
import {colors} from '@/theme';

function AppToast({
  icon,
  color,
  text1,
  text2,
}: ToastConfigParams<unknown> & {icon: IconName; color: string}) {
  return (
    <View
      className="mx-4 flex-row items-center rounded-2xl p-3.5 shadow-md"
      style={{backgroundColor: colors.toast}}>
      <Ionicons name={icon} size={24} color={color} />
      <View className="ml-2.5 flex-1">
        <Text className="font-bold text-white">{text1}</Text>
        {!!text2 && (
          <Text className="text-xs" style={{color: colors.toastText}}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: props => <AppToast {...props} icon="checkmark-circle" color={colors.success} />,
  error: props => <AppToast {...props} icon="close-circle" color={colors.error} />,
  info: props => <AppToast {...props} icon="information-circle" color={colors.info} />,
};
