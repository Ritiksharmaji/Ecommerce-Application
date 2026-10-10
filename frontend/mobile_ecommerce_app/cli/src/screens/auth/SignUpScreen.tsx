import React, {useState} from 'react';
import {View} from 'react-native';
import {Text} from '@/components/ui/Typography';
import Toast from 'react-native-toast-message';
import FormField from '@/components/common/FormField';
import PasswordInput from '@/components/common/PasswordInput';
import PrimaryButton from '@/components/common/PrimaryButton';
import {useAuth} from '@/context/AuthContext';
import type {RootStackScreenProps} from '@/navigation/types';
import {getErrorMessage} from '@/utils/errors';
import AuthLayout from './components/AuthLayout';

const MIN_PASSWORD_LENGTH = 6;

export default function SignUpScreen({navigation}: RootStackScreenProps<'SignUp'>) {
  const {signUp} = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      Toast.show({
        type: 'error',
        text1: 'Password too short',
        text2: `Use at least ${MIN_PASSWORD_LENGTH} characters`,
      });
      return;
    }
    setLoading(true);
    try {
      const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || 'User';
      await signUp(name, email, password);
    } catch (error) {
      Toast.show({type: 'error', text1: 'Sign up failed', text2: getErrorMessage(error)});
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to get started"
      onBack={() => navigation.goBack()}
      footer={
        <>
          <Text className="text-secondary">Already have an account? </Text>
          <Text className="font-bold text-primary" onPress={() => navigation.replace('SignIn')}>
            Login
          </Text>
        </>
      }>
      <View className="flex-row gap-3">
        <FormField
          label="First Name"
          containerClassName="mb-4 flex-1"
          placeholder="John"
          autoComplete="given-name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <FormField
          label="Last Name"
          containerClassName="mb-4 flex-1"
          placeholder="Doe"
          autoComplete="family-name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
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
        title="Create Account"
        rounded
        loading={loading}
        disabled={!email || !password}
        onPress={handleSignUp}
      />
    </AuthLayout>
  );
}
