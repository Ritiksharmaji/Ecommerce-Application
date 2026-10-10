import palette from './colors.json';

/** Brand colours (shared with tailwind.config.js and the web app). */
export const colors = palette;
export type ColorName = keyof typeof colors;

/** Brand typeface (bundled in src/assets/fonts, same as the web app). */
export const fonts = {family: 'Outfit'} as const;
