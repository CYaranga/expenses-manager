/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#547792',
          600: '#3d5a73',
          700: '#1A3263',
          800: '#152a52',
          900: '#102240',
        },
        accent: {
          50: '#fff9eb',
          100: '#fef0cc',
          200: '#fee4a3',
          300: '#fdd77a',
          400: '#FAB95B',
          500: '#f5a623',
          600: '#db8b0a',
          700: '#b6700a',
          800: '#93580f',
          900: '#794810',
        },
        cream: {
          50: '#fdfcfb',
          100: '#f9f6f3',
          200: '#f3ede7',
          300: '#E8E2DB',
          400: '#d4cbc0',
          500: '#bfb3a4',
          600: '#a89a88',
          700: '#8a7d6d',
          800: '#71665a',
          900: '#5d544a',
        },
      },
    },
  },
  plugins: [],
};
