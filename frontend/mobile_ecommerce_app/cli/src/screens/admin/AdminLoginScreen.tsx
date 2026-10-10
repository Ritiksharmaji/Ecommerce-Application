import React, {useState} from 'react';
import {Text} from '@/components/ui/Typography';
import Toast from 'react-native-toast-message';
import FormField from '@/components/common/FormField';
import PasswordInput from '@/components/common/PasswordInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import {useAuth} from '@/context/AuthContext';
import {useAppNavigation} from '@/navigation/hooks';
import AuthLayout from '@/screens/auth/components/AuthLayout';
import {getErrorMessage} from '@/utils/errors';

/** Shown by AdminNavigator until a user with the admin role signs in. */
export default function AdminLoginScreen() {
  const navigation = useAppNavigation();
  const {adminLogin} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await adminLogin(email, password);
    } catch (error) {
      Toast.show({type: 'error', text1: 'Login failed', text2: getErrorMessage(error)});
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Panel"
      subtitle="Sign in with an admin account"
      onBack={() =>
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')
      }>
      <FormField
        label="Email"
        placeholder="admin@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text className="mb-1 text-xs font-bold uppercase text-secondary">Password</Text>
      <PasswordInput value={password} onChangeText={setPassword} className="mb-6" />
      <PrimaryButton
        title="Login"
        rounded
        loading={loading}
        disabled={!email || !password}
        onPress={handleLogin}
      />
    </AuthLayout>
  );
}
