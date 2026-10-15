import React, {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import FormField from '@/components/common/FormField';
import PrimaryButton from '@/components/common/PrimaryButton';
import {Text} from '@/components/ui/Typography';
import {useAuth} from '@/context/AuthContext';
import {getErrorMessage} from '@/utils/errors';

interface AuthFormCardProps {
  prefill: Record<string, any>;
  disabled: boolean;
  onDone: (ok: boolean, result: string) => void;
}

/**
 * Sign-in / create-account form shown inside the chat. The password is typed here and sent straight to
 * POST /api/auth/login | /register - it never goes to the AI.
 */
export default function AuthFormCard({prefill, disabled, onDone}: AuthFormCardProps) {
  const {signIn, signUp} = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    prefill.mode === 'signup' ? 'signup' : 'signin',
  );
  const [name, setName] = useState<string>(prefill.name ?? '');
  const [email, setEmail] = useState<string>(prefill.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signup = mode === 'signup';
  const complete = !!email.trim() && !!password && (!signup || !!name.trim());

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (signup) await signUp(name, email, password);
      else await signIn(email, password);
      onDone(
        true,
        signup
          ? `Created a new account for ${name.trim()} (${email.trim()}) and signed in.`
          : `Signed in as ${email.trim()}.`,
      );
    } catch (e) {
      setError(getErrorMessage(e, signup ? 'Could not create the account' : 'Could not sign in'));
      setBusy(false);
    }
  };

  return (
    <View className="rounded-2xl border border-border bg-background p-4">
      <Text className="mb-3 text-base font-bold text-primary">
        {signup ? 'Create your account' : 'Sign in'}
      </Text>
      {signup && (
        <FormField
          label="Full name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          editable={!disabled}
          containerClassName="mb-3"
        />
      )}
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!disabled}
        containerClassName="mb-3"
      />
      {!disabled && (
        <>
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={signup ? 'new-password' : 'current-password'}
            placeholder={signup ? 'At least 6 characters' : undefined}
            containerClassName="mb-2"
          />
          <Text className="mb-3 text-[11px] text-muted">
            Your password goes only to the secure Shopvra sign-in, never to the assistant.
          </Text>
        </>
      )}
      {!!error && <Text className="mb-2 text-xs text-error">{error}</Text>}
      {!disabled && (
        <>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => onDone(false, 'The user cancelled signing in.')}
              className="flex-1 items-center justify-center rounded-xl border border-border py-3">
              <Text className="font-semibold text-primary">Cancel</Text>
            </TouchableOpacity>
            <PrimaryButton
              title={signup ? 'Create account' : 'Sign in'}
              onPress={submit}
              loading={busy}
              disabled={!complete}
              className="flex-1 py-3"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setMode(signup ? 'signin' : 'signup');
              setError(null);
            }}
            className="mt-3">
            <Text className="text-xs text-secondary underline">
              {signup ? 'Already have an account? Sign in' : 'New to Shopvra? Create an account'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
