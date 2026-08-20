/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#14151B',
          900: '#1C1E26',
          800: '#262834',
          700: '#333644',
        },
        canvas: '#FAF9F6',
        coral: {
          DEFAULT: '#FF6B4A',
          dark: '#E8532F',
          light: '#FFE4DB',
        },
        teal: {
          DEFAULT: '#2DD4BF',
        },
        ink: '#20232B',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
