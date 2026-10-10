import React, {forwardRef} from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import {fonts} from '@/theme';

/**
 * Text and TextInput with the brand font (Outfit, same as the web app). Use these instead of the
 * react-native versions; `className` (NativeWind) and `style` work as usual, and font-medium /
 * font-bold etc. pick the matching Outfit weight.
 */
export const Text = forwardRef<RNText, TextProps>(({style, ...props}, ref) => (
  <RNText ref={ref} style={[{fontFamily: fonts.family}, style]} {...props} />
));
Text.displayName = 'Text';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({style, ...props}, ref) => (
  <RNTextInput ref={ref} style={[{fontFamily: fonts.family}, style]} {...props} />
));
TextInput.displayName = 'TextInput';
