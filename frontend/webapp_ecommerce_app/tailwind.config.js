/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Shopvra brand palette - same values as the mobile app (cli/src/theme/colors.json)
      colors: {
        primary: '#111111',
        secondary: '#666666',
        surface: '#F7F7F7',
        accent: '#FF4C3B',
        border: '#EEEEEE',
        muted: '#999999',
        success: '#22C55E',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
