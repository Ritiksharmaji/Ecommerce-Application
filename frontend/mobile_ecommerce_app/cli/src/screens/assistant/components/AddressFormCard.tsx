import React, {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import FormField from '@/components/common/FormField';
import PrimaryButton from '@/components/common/PrimaryButton';
import {Text} from '@/components/ui/Typography';
import {addressApi} from '@/services/api';
import type {Address, ShippingAddress} from '@/types/models';
import {getErrorMessage} from '@/utils/errors';

interface AddressFormCardProps {
  prefill: Record<string, any>;
  disabled: boolean;
  onDone: (ok: boolean, result: string) => void;
}

const TYPES: Address['type'][] = ['Home', 'Work', 'Other'];

/** Address form shown inside the chat; Save calls POST /api/addresses. */
export default function AddressFormCard({prefill, disabled, onDone}: AddressFormCardProps) {
  const [type, setType] = useState<Address['type']>(
    TYPES.includes(prefill.type) ? prefill.type : 'Home',
  );
  const [form, setForm] = useState<ShippingAddress>({
    street: prefill.street ?? '',
    city: prefill.city ?? '',
    state: prefill.state ?? '',
    zipCode: prefill.zipCode ?? '',
    country: prefill.country ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = Object.values(form).every(v => v.trim());
  const set = (key: keyof ShippingAddress) => (value: string) =>
    setForm(prev => ({...prev, [key]: value}));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await addressApi.create({...form, type});
      onDone(
        true,
        `Address saved (id ${saved._id}): ${form.street}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}.`,
      );
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save the address'));
      setSaving(false);
    }
  };

  return (
    <View className="rounded-2xl border border-border bg-background p-4">
      <Text className="mb-3 text-base font-bold text-primary">New delivery address</Text>
      <View className="mb-3 flex-row gap-2">
        {TYPES.map(t => (
          <TouchableOpacity
            key={t}
            disabled={disabled}
            onPress={() => setType(t)}
            className={`rounded-full border px-3 py-1.5 ${
              type === t ? 'border-primary bg-primary' : 'border-border'
            }`}>
            <Text className={`text-xs ${type === t ? 'text-white' : 'text-primary'}`}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormField
        label="Street"
        value={form.street}
        onChangeText={set('street')}
        editable={!disabled}
        containerClassName="mb-3"
      />
      <View className="flex-row gap-2">
        <FormField
          label="City"
          value={form.city}
          onChangeText={set('city')}
          editable={!disabled}
          containerClassName="mb-3 flex-1"
        />
        <FormField
          label="State"
          value={form.state}
          onChangeText={set('state')}
          editable={!disabled}
          containerClassName="mb-3 flex-1"
        />
      </View>
      <View className="flex-row gap-2">
        <FormField
          label="Zip code"
          value={form.zipCode}
          onChangeText={set('zipCode')}
          keyboardType="number-pad"
          editable={!disabled}
          containerClassName="mb-3 flex-1"
        />
        <FormField
          label="Country"
          value={form.country}
          onChangeText={set('country')}
          editable={!disabled}
          containerClassName="mb-3 flex-1"
        />
      </View>
      {!!error && <Text className="mb-2 text-xs text-error">{error}</Text>}
      {!disabled && (
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onDone(false, 'The user cancelled the address form.')}
            className="flex-1 items-center justify-center rounded-xl border border-border py-3">
            <Text className="font-semibold text-primary">Cancel</Text>
          </TouchableOpacity>
          <PrimaryButton
            title="Save"
            onPress={save}
            loading={saving}
            disabled={!complete}
            className="flex-1 py-3"
          />
        </View>
      )}
    </View>
  );
}
