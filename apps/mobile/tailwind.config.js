/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── BiteBolt Design System ──────────────────────────
        primary: {
          50:  '#FFF3EE',
          100: '#FFE4D5',
          200: '#FFC9AB',
          300: '#FFA577',
          400: '#FA8D52',
          500: '#FA7938', // ← brand orange
          600: '#E8641E',
          700: '#C84F12',
          800: '#A63C0A',
          900: '#872E06',
          DEFAULT: '#FA7938',
        },
        brand:   '#FA7938',

        // Dark navy text / secondary
        secondary: {
          DEFAULT: '#414158',
          light:   '#D3D6DE',
        },

        // Tertiary palette
        tertiary: {
          purple:   '#808AFF',
          lavender: '#CE7ECE',
          pink:     '#D59096',
        },

        // Accent
        accent: {
          orange: '#F67F58',
          teal:   '#04AFAE',
        },

        // App background – soft lavender
        background: '#EEEEF5',

        // Surfaces
        surface: {
          DEFAULT:    '#FFFFFF',
          dark:       '#1A1A2E',
          card:       '#FFFFFF',
          'card-dark':'#252535',
        },

        // Text
        text: {
          primary:          '#414158',
          secondary:        '#9098B1',
          muted:            '#C4C9D4',
          'primary-dark':   '#FFFFFF',
          'secondary-dark': '#A1A1BB',
        },

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
      },

      fontFamily: {
        sans:    ['Urbanist', 'Inter', 'System'],
        heading: ['Urbanist-SemiBold', 'Inter-Bold', 'System'],
      },

      borderRadius: {
        card:   '16px',
        button: '14px',
        input:  '12px',
        pill:   '9999px',
        xl2:    '20px',
      },

      boxShadow: {
        card:  '0 4px 20px rgba(0,0,0,0.06)',
        float: '0 8px 32px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
