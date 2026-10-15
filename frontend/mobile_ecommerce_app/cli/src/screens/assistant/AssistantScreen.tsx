import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons, type IconName} from '@/components/icons';
import {Text, TextInput} from '@/components/ui/Typography';
import {CHAT_LANGUAGES} from '@/constants/languages';
import {useChat} from '@/context/ChatContext';
import {useSpeechInput} from '@/hooks/useSpeechInput';
import type {RootStackScreenProps} from '@/navigation/types';
import {colors} from '@/theme';
import type {ChatItem} from '@/types/chat';
import AccountActionCard from './components/AccountActionCard';
import AddressFormCard from './components/AddressFormCard';
import AuthFormCard from './components/AuthFormCard';
import ChatProductCards from './components/ChatProductCards';
import ConfirmOrderCard from './components/ConfirmOrderCard';
import {useAssistantActions} from './useAssistantActions';

const SUGGESTIONS = [
  'Show me denim jackets',
  'Shoes under $60',
  "What's in my cart?",
  'Sign me in',
  'Add a new address',
  'Where is my order?',
];

const ACTION_LABEL: Record<string, IconName> = {
  navigate: 'open-outline',
  add_to_cart: 'bag-add-outline',
  show_address_form: 'location-outline',
  confirm_order: 'receipt-outline',
  update_cart_item: 'bag-check-outline',
  update_wishlist: 'heart-outline',
};

/** Actions rendered as confirmation cards by AccountActionCard. */
const CONFIRM_ACTIONS = ['clear_cart', 'delete_address', 'sign_out', 'delete_account'];

export default function AssistantScreen({navigation}: RootStackScreenProps<'Assistant'>) {
  const {
    items,
    loading,
    sendMessage,
    resolveAction,
    resetChat,
    readAloud,
    toggleReadAloud,
    language,
    setLanguage,
  } = useChat();
  const [text, setText] = useState('');
  const [pickingLanguage, setPickingLanguage] = useState(false);
  const languageLabel = CHAT_LANGUAGES.find(l => l.code === language)?.label ?? 'English';
  const list = useRef<FlatList<ChatItem>>(null);
  useAssistantActions();

  useEffect(() => {
    const t = setTimeout(() => list.current?.scrollToEnd({animated: true}), 100);
    return () => clearTimeout(t);
  }, [items.length, loading]);

  const send = (value: string) => {
    sendMessage(value);
    setText('');
  };

  // Voice input: whatever the user says is sent like a typed message.
  const voice = useSpeechInput(send, language);
  const toggleMic = () => (voice.listening ? voice.stop() : voice.start());

  const renderItem = ({item}: {item: ChatItem}) => {
    switch (item.kind) {
      case 'user':
        return (
          <View className="mb-3 max-w-[82%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5">
            <Text className="text-white">{item.text}</Text>
          </View>
        );
      case 'assistant':
        return (
          <View className="mb-3">
            {!!item.text && (
              <View className="max-w-[88%] self-start rounded-2xl rounded-bl-md bg-surface px-4 py-2.5">
                <Text className="leading-5 text-primary">{item.text}</Text>
              </View>
            )}
            <ChatProductCards products={item.products} />
          </View>
        );
      case 'error':
        return (
          <View className="mb-3 self-start rounded-2xl bg-red-50 px-4 py-2.5">
            <Text className="text-error">{item.text}</Text>
          </View>
        );
      case 'action': {
        const {action, status} = item;
        const done = status !== 'pending';
        if (action.name === 'show_address_form') {
          return (
            <View className="mb-3">
              <AddressFormCard
                prefill={action.input}
                disabled={done}
                onDone={(ok, result) => resolveAction(action.id, ok, result)}
              />
            </View>
          );
        }
        if (action.name === 'show_auth_form') {
          return (
            <View className="mb-3">
              <AuthFormCard
                prefill={action.input}
                disabled={done}
                onDone={(ok, result) => resolveAction(action.id, ok, result)}
              />
            </View>
          );
        }
        if (CONFIRM_ACTIONS.includes(action.name)) {
          return (
            <View className="mb-3">
              <AccountActionCard
                action={action}
                disabled={done}
                onDone={(ok, result) => resolveAction(action.id, ok, result)}
              />
            </View>
          );
        }
        if (action.name === 'confirm_order') {
          return (
            <View className="mb-3">
              <ConfirmOrderCard
                input={action.input}
                disabled={done}
                onDone={(ok, result) => resolveAction(action.id, ok, result)}
              />
            </View>
          );
        }
        return (
          <View className="mb-3 flex-row items-center self-start rounded-full bg-surface px-3 py-1.5">
            {done ? (
              <Ionicons
                name={
                  status === 'done'
                    ? ACTION_LABEL[action.name] ?? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={14}
                color={status === 'done' ? colors.secondary : colors.error}
              />
            ) : (
              <ActivityIndicator size="small" color={colors.secondary} />
            )}
            <Text className="ml-1.5 text-xs text-secondary" numberOfLines={2}>
              {item.note ?? 'Working on it...'}
            </Text>
          </View>
        );
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Close assistant">
          <Ionicons name="close" size={26} color={colors.primary} />
        </TouchableOpacity>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-primary">Shopvra Assistant</Text>
          <Text className="text-xs text-secondary">Type or talk in any language</Text>
        </View>
        <TouchableOpacity
          onPress={() => setPickingLanguage(true)}
          className="mr-3 flex-row items-center rounded-full bg-surface px-2.5 py-1"
          accessibilityLabel={`Chat language: ${languageLabel}. Change language`}>
          <Ionicons name="language-outline" size={16} color={colors.primary} />
          <Text className="ml-1 text-xs font-semibold text-primary" numberOfLines={1}>
            {languageLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleReadAloud}
          className="mr-4"
          accessibilityRole="switch"
          accessibilityState={{checked: readAloud}}
          accessibilityLabel={readAloud ? 'Stop reading replies aloud' : 'Read replies aloud'}>
          <Ionicons
            name={readAloud ? 'volume-high' : 'volume-mute-outline'}
            size={24}
            color={readAloud ? colors.accent : colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={resetChat} accessibilityLabel="New chat" disabled={loading}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={list}
          data={items}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerClassName="flex-grow px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 pb-10">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <Ionicons name="sparkles" size={30} color={colors.accent} />
              </View>
              <Text className="mb-1 text-xl font-bold text-primary">Hi! How can I help?</Text>
              <Text className="mb-6 text-center text-secondary">
                Ask me to find products, add them to your cart, save an address or place an order.
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => send(s)}
                    className="rounded-full border border-border px-3 py-2">
                    <Text className="text-sm text-primary">{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={
            loading ? (
              <View className="mb-3 flex-row items-center self-start rounded-2xl bg-surface px-4 py-3">
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text className="ml-2 text-secondary">Thinking...</Text>
              </View>
            ) : null
          }
        />

        {(voice.listening || !!voice.error) && (
          <View className="flex-row items-center px-4 pb-1 pt-2">
            {voice.listening && <View className="mr-2 h-2.5 w-2.5 rounded-full bg-accent" />}
            <Text className={`text-xs ${voice.error ? 'text-error' : 'text-secondary'}`}>
              {voice.error ?? 'Listening... speak now, tap the mic to stop'}
            </Text>
          </View>
        )}
        <View className="flex-row items-end border-t border-border px-3 py-2">
          <TextInput
            className="max-h-28 flex-1 rounded-2xl bg-surface px-4 py-3 text-primary"
            placeholder={voice.listening ? 'Listening...' : 'Type or tap the mic to talk...'}
            placeholderTextColor={colors.muted}
            value={voice.listening ? voice.partial : text}
            onChangeText={setText}
            editable={!voice.listening}
            multiline
            maxLength={1000}
            accessibilityLabel="Message"
          />
          {voice.available && (
            <TouchableOpacity
              onPress={toggleMic}
              disabled={loading}
              className={`ml-2 h-11 w-11 items-center justify-center rounded-full ${
                voice.listening ? 'bg-accent' : 'bg-surface'
              }`}
              accessibilityLabel={voice.listening ? 'Stop listening' : 'Speak your message'}>
              <Ionicons
                name={voice.listening ? 'stop' : 'mic'}
                size={22}
                color={voice.listening ? '#fff' : colors.primary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => send(text)}
            disabled={!text.trim() || loading}
            className={`ml-2 h-11 w-11 items-center justify-center rounded-full ${
              text.trim() && !loading ? 'bg-primary' : 'bg-gray-300'
            }`}
            accessibilityLabel="Send">
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={pickingLanguage}
        transparent
        animationType="fade"
        onRequestClose={() => setPickingLanguage(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPickingLanguage(false)}>
          <Pressable className="max-h-[70%] rounded-t-3xl bg-background px-5 pb-8 pt-5">
            <Text className="text-lg font-bold text-primary">Chat language</Text>
            <Text className="mb-3 text-xs text-secondary">
              Used for the mic and read-aloud. You can also just type in any language.
            </Text>
            <FlatList
              data={CHAT_LANGUAGES}
              keyExtractor={l => l.code}
              renderItem={({item: l}) => (
                <TouchableOpacity
                  onPress={() => {
                    setLanguage(l.code);
                    setPickingLanguage(false);
                  }}
                  accessibilityState={{selected: l.code === language}}
                  className="flex-row items-center justify-between border-b border-border py-3.5">
                  <Text className="text-base text-primary">
                    {l.label}
                    {l.name !== l.label ? (
                      <Text className="text-sm text-secondary">{`  ${l.name}`}</Text>
                    ) : null}
                  </Text>
                  {l.code === language && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
