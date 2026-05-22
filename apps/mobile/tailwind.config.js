/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
          DEFAULT: '#FF5722',
        },
        brand: '#FF5722',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1A1A',
          card: '#F8F9FA',
          'card-dark': '#2A2A2A',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          'primary-dark': '#FFFFFF',
          'secondary-dark': '#A1A1AA',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        heading: ['Inter-Bold', 'System'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '10px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
