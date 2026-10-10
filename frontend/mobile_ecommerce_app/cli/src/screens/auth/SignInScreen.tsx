import React, {useState} from 'react';
import {Text} from '@/components/ui/Typography';
import Toast from 'react-native-toast-message';
import FormField from '@/components/common/FormField';
import PasswordInput from '@/components/common/PasswordInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import {useAuth} from '@/context/AuthContext';
import type {RootStackScreenProps} from '@/navigation/types';
import {getErrorMessage} from '@/utils/errors';
import AuthLayout from './components/AuthLayout';

export default function SignInScreen({navigation}: RootStackScreenProps<'SignIn'>) {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // On success RootNavigator drops the guest-only screens and the user returns to where they were.
  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Toast.show({type: 'error', text1: 'Sign in failed', text2: getErrorMessage(error)});
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue"
      onBack={() => navigation.goBack()}
      footer={
        <>
          <Text className="text-secondary">Don't have an account? </Text>
          <Text className="font-bold text-primary" onPress={() => navigation.replace('SignUp')}>
            Sign up
          </Text>
        </>
      }>
      <FormField
        label="Email"
        placeholder="user@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Text className="mb-1 text-xs font-bold uppercase text-secondary">Password</Text>
      <PasswordInput value={password} onChangeText={setPassword} className="mb-6" />
      <PrimaryButton
        title="Sign In"
        rounded
        loading={loading}
        disabled={!email || !password}
        onPress={handleSignIn}
      />
    </AuthLayout>
  );
}
