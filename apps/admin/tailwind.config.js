/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── BiteBolt Design System (identical to apps/mobile) ───────────────
        primary: {
          50: '#FFF3EE',
          100: '#FFE4D5',
          200: '#FFC9AB',
          300: '#FFA577',
          400: '#FA8D52',
          500: '#FA7938',
          600: '#E8641E',
          700: '#C84F12',
          800: '#A63C0A',
          900: '#872E06',
          DEFAULT: '#FA7938',
        },
        brand: '#FA7938',
        secondary: {
          DEFAULT: '#414158',
          light: '#D3D6DE',
        },
        tertiary: {
          purple: '#808AFF',
          lavender: '#CE7ECE',
          pink: '#D59096',
        },
        accent: {
          orange: '#F67F58',
          teal: '#04AFAE',
        },
        background: '#EEEEF5',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1A2E',
          card: '#FFFFFF',
          'card-dark': '#252535',
        },
        text: {
          primary: '#414158',
          secondary: '#9098B1',
          muted: '#C4C9D4',
          'primary-dark': '#FFFFFF',
          'secondary-dark': '#A1A1BB',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Urbanist', 'Inter', 'System'],
        heading: ['Urbanist-SemiBold', 'Inter-Bold', 'System'],
      },

      // ── Typography scale (mirrors src/theme tokens.fontSize) ──────────────
      fontSize: {
        tiny: ['10px', { lineHeight: '13px' }],
        overline: ['11px', { lineHeight: '14px' }],
        caption: ['12px', { lineHeight: '16px' }],
        label: ['13px', { lineHeight: '18px' }],
        body: ['14px', { lineHeight: '20px' }],
        md: ['15px', { lineHeight: '20px' }],
        'body-lg': ['16px', { lineHeight: '22px' }],
        h3: ['18px', { lineHeight: '24px' }],
        h2: ['20px', { lineHeight: '26px' }],
        h1: ['24px', { lineHeight: '30px' }],
        display: ['32px', { lineHeight: '38px' }],
      },

      // ── Spacing · 4-point grid (mirrors src/theme tokens.space) ───────────
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
      },

      // ── Border radius tokens (mirrors src/theme tokens.radius) ────────────
      borderRadius: {
        control: '12px',
        button: '14px',
        field: '16px',
        card: '16px',
        panel: '24px',
        hero: '32px',
        pill: '9999px',
        // legacy aliases (do not use in new code)
        input: '12px',
        xl2: '20px',
      },

      // ── Elevation levels (mirrors src/theme elevation) ────────────────────
      boxShadow: {
        sm: '0 3px 10px rgba(0,0,0,0.05)',
        md: '0 6px 16px rgba(0,0,0,0.05)',
        lg: '0 8px 20px rgba(26,26,36,0.10)',
        'brand-sm': '0 2px 6px rgba(250,121,56,0.25)',
        'brand-lg': '0 8px 14px rgba(250,121,56,0.30)',
        // legacy aliases
        card: '0 4px 20px rgba(0,0,0,0.06)',
        float: '0 8px 32px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
