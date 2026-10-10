# E-commerce Mobile App

Two versions of the same app (shop + admin panel), both using the Express backend at
`https://api.shopvra.space`:

| Folder | Built with | Run | Release build |
|---|---|---|---|
| [`expo/`](expo) | Expo SDK 54 + expo-router | `cd expo && npx expo start -c` | `eas build -p android --profile preview` (APK) / `--profile production` (AAB) |
| [`cli/`](cli) | React Native CLI 0.81.5 + React Navigation | `cd cli && npm start` then `npm run android` | `cd cli && npm run build:apk` / `npm run build:aab` |

Features are the same in both (the CLI app uses a typed, feature-based structure); see [`cli/README.md`](cli/README.md) for what
replaced each Expo library and how to sign builds for the Play Store.
