module.exports = {
  preset: 'react-native',
  // React Navigation ships untranspiled ESM, so let Babel transform it
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-css-interop|nativewind)/)',
  ],
};
