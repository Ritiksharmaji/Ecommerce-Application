import {DefaultTheme, type Theme} from '@react-navigation/native';
import {colors, fonts} from '@/theme';

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.primary,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: {
    regular: {fontFamily: fonts.family, fontWeight: '400'},
    medium: {fontFamily: fonts.family, fontWeight: '500'},
    bold: {fontFamily: fonts.family, fontWeight: '700'},
    heavy: {fontFamily: fonts.family, fontWeight: '800'},
  },
};

/** Header style shared by stacks/tabs that show the native header. */
export const headerScreenOptions = {
  headerStyle: {backgroundColor: colors.background},
  headerTintColor: colors.primary,
  headerTitleStyle: {fontFamily: fonts.family, fontWeight: '700' as const},
  headerShadowVisible: false,
};
