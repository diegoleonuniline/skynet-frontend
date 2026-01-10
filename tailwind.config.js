/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E2A3A',
          50: '#E8EBF0',
          100: '#C5CCD6',
          200: '#9EAABB',
          300: '#7789A1',
          400: '#506786',
          500: '#1E2A3A',
          600: '#1A2533',
          700: '#161F2C',
          800: '#121A24',
          900: '#0E141D'
        },
        secondary: {
          DEFAULT: '#6366F1',
          50: '#ECEEFE',
          100: '#D9DDFD',
          200: '#B3BBFB',
          300: '#8D99F9',
          400: '#6777F7',
          500: '#6366F1',
          600: '#4F52C9',
          700: '#3B3EA1',
          800: '#272A79',
          900: '#131551'
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
          dark: '#15803D'
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706'
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C'
        },
        background: '#F8FAFC',
        surface: '#FFFFFF'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
