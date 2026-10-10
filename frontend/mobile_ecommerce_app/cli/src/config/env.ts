import {NativeModules, Platform} from 'react-native';

/**
 * Runtime configuration. A mobile app ships no secrets, so plain constants selected by build type
 * (__DEV__) are enough: debug builds talk to the backend on your computer, release builds (APK/AAB)
 * to the deployed API on AWS.
 */

/** Deployed backend (AWS Lambda + CloudFront). */
export const PRODUCTION_API_URL = 'https://api.shopvra.space';

/** Port of the backend when it runs locally (`npm start` in expressJs_ecommerce_backend). */
const DEV_BACKEND_PORT = 3000;

/**
 * Force one backend in every build, e.g. PRODUCTION_API_URL to test the deployed API from a debug
 * build, or 'http://192.168.1.10:3000'. null = automatic.
 */
const API_URL_OVERRIDE: string | null = null;

/** Host of the Metro bundler the debug JS bundle was loaded from (your computer). */
const getMetroHost = (): string | undefined => {
  const sourceCode = NativeModules.SourceCode;
  const scriptURL: string | undefined =
    sourceCode?.getConstants?.().scriptURL ?? sourceCode?.scriptURL;
  return scriptURL?.match(/^https?:\/\/([^:/]+)/)?.[1];
};

const getDevApiUrl = (): string => {
  const host = getMetroHost();
  if (host) {
    // Same machine as Metro. For "localhost" (USB / emulator) run `npm run android:reverse`.
    return `http://${host}:${DEV_BACKEND_PORT}`;
  }
  return Platform.select({
    android: `http://10.0.2.2:${DEV_BACKEND_PORT}`, // Android emulator -> computer's localhost
    default: `http://localhost:${DEV_BACKEND_PORT}`,
  });
};

/** Public website (privacy policy and account deletion pages live here). */
const WEBSITE_URL = 'https://shopvra.space';

export const env = {
  apiUrl: API_URL_OVERRIDE ?? (__DEV__ ? getDevApiUrl() : PRODUCTION_API_URL),
  isProduction: !__DEV__,
  websiteUrl: WEBSITE_URL,
  privacyPolicyUrl: `${WEBSITE_URL}/privacy`,
  deleteAccountUrl: `${WEBSITE_URL}/delete-account`,
} as const;
