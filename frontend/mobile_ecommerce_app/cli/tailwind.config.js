const colors = require('./src/theme/colors.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Same palette as src/theme (used where a raw colour value is needed, e.g. icons).
    extend: {colors},
  },
  plugins: [],
};
