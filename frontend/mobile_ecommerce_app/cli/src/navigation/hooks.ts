import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';

/** Navigation for shared components that are not screens (header, product card...). */
export const useAppNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
