import type {ComponentProps} from 'react';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';

/**
 * Icon sets used by the app. The fonts ship inside the packages: nothing to link on Android; on iOS
 * they are listed under UIAppFonts in Info.plist.
 */
export {Ionicons};
export {Feather} from '@react-native-vector-icons/feather/static';

/** Any Ionicons glyph name, e.g. 'cart-outline'. */
export type IconName = ComponentProps<typeof Ionicons>['name'];
