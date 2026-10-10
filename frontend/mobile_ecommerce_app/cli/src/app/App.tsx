import '../../global.css';
import React from 'react';
import {StatusBar} from 'react-native';
import Toast from 'react-native-toast-message';
import {toastConfig} from '@/components/toast/toastConfig';
import RootNavigator from '@/navigation/RootNavigator';
import {colors} from '@/theme';
import AppProviders from './AppProviders';

export default function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <RootNavigator />
      <Toast config={toastConfig} />
    </AppProviders>
  );
}
