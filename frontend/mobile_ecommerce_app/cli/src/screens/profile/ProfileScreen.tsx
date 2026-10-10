import React, {useState} from 'react';
import {Alert, Linking, ScrollView, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppHeader from '@/components/common/AppHeader';
import PrimaryButton from '@/components/common/PrimaryButton';
import {Ionicons, type IconName} from '@/components/icons';
import {Text} from '@/components/ui/Typography';
import {env} from '@/config/env';
import {useAuth} from '@/context/AuthContext';
import type {MainTabScreenProps} from '@/navigation/types';
import {colors} from '@/theme';
import {getErrorMessage} from '@/utils/errors';
import DeleteAccountSheet from './components/DeleteAccountSheet';

interface MenuItem {
  title: string;
  icon: IconName;
  onPress: () => void;
  visible?: boolean;
}

function Menu({items}: {items: MenuItem[]}) {
  const shown = items.filter(item => item.visible !== false);
  return (
    <View className="mb-4 rounded-xl border border-border bg-background p-2">
      {shown.map((item, index) => (
        <TouchableOpacity
          key={item.title}
          onPress={item.onPress}
          className={`flex-row items-center p-4 ${
            index < shown.length - 1 ? 'border-b border-border' : ''
          }`}>
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <Text className="flex-1 font-medium text-primary">{item.title}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProfileScreen({navigation}: MainTabScreenProps<'Profile'>) {
  const {user, isAdmin, signOut, deleteAccount} = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openPrivacyPolicy = () => Linking.openURL(env.privacyPolicyUrl);

  const confirmLogout = () =>
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log Out', style: 'destructive', onPress: signOut},
    ]);

  const handleDelete = async (password: string) => {
    setDeleting(true);
    try {
      await deleteAccount(password);
      setShowDelete(false);
      Toast.show({type: 'success', text1: 'Account deleted', text2: 'Sorry to see you go.'});
    } catch (error) {
      Toast.show({type: 'error', text1: 'Could not delete account', text2: getErrorMessage(error)});
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader title="Profile" />

      {!user ? (
        <View className="flex-1 px-8">
          <View className="flex-1 items-center justify-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <Ionicons name="person" size={40} color={colors.secondary} />
            </View>
            <Text className="mb-2 text-xl font-bold text-primary">Guest User</Text>
            <Text className="mb-8 text-center text-base text-secondary">
              Log in to view your profile and orders.
            </Text>
            <PrimaryButton
              title="Login / Sign Up"
              rounded
              className="w-3/5"
              onPress={() => navigation.navigate('SignIn')}
            />
          </View>
          <TouchableOpacity onPress={openPrivacyPolicy} className="items-center pb-6">
            <Text className="text-sm text-secondary underline">Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8 pt-4">
          <View className="mb-8 items-center">
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-gray-200">
              <Ionicons name="person" size={36} color={colors.secondary} />
            </View>
            <Text className="text-xl font-bold text-primary">{user.name}</Text>
            <Text className="text-sm text-secondary">{user.email}</Text>
          </View>

          <Menu
            items={[
              {
                title: 'My Orders',
                icon: 'receipt-outline',
                onPress: () => navigation.navigate('Orders'),
              },
              {
                title: 'Admin Panel',
                icon: 'shield-checkmark-outline',
                onPress: () => navigation.navigate('Admin'),
                visible: isAdmin,
              },
            ]}
          />
          <Menu
            items={[
              {title: 'Privacy Policy', icon: 'document-text-outline', onPress: openPrivacyPolicy},
            ]}
          />

          <TouchableOpacity className="items-center p-4" onPress={confirmLogout}>
            <Text className="font-bold text-primary">Log Out</Text>
          </TouchableOpacity>
          {!isAdmin && (
            <TouchableOpacity className="items-center p-2" onPress={() => setShowDelete(true)}>
              <Text className="text-sm font-medium text-error">Delete Account</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <DeleteAccountSheet
        visible={showDelete}
        deleting={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
      />
    </SafeAreaView>
  );
}
