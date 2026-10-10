module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    // NativeWind (className styles). Also adds the Reanimated/Worklets plugin.
    'nativewind/babel',
  ],
  plugins: [
    // "@/..." imports point to ./src (same alias as the Expo app)
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {'@': './src'},
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
  ],
};
