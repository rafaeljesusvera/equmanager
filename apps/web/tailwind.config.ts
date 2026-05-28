import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'Instrument Serif',
          'ui-serif',
          'Georgia',
          'serif',
        ],
      },
      colors: {
        brand: {
          50: '#f1f8f3',
          100: '#dcedde',
          200: '#bbdcc0',
          300: '#8fc395',
          400: '#5ea568',
          500: '#3f8649',
          600: '#2f6a39',
          700: '#27552f',
          800: '#1f4327',
          900: '#16361e',
          950: '#0c2014',
        },
        accent: {
          50: '#fef9ed',
          100: '#fcefc8',
          200: '#fadc8d',
          300: '#f7c44c',
          400: '#f4b020',
          500: '#dd9510',
          600: '#bb720d',
          700: '#955310',
          800: '#7a4214',
          900: '#653716',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        soft: '0 4px 14px rgba(22, 54, 30, 0.06)',
        lift: '0 12px 24px -8px rgba(22, 54, 30, 0.12), 0 4px 10px -4px rgba(22, 54, 30, 0.08)',
        glow: '0 0 0 1px rgba(63, 134, 73, 0.18), 0 12px 30px -8px rgba(63, 134, 73, 0.28)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
