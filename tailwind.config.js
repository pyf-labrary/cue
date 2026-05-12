/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0A0C',
          900: '#0F0F12',
          800: '#15151A',
          700: '#1C1C22',
          600: '#26262E',
          500: '#3A3A45',
          400: '#5A5A66',
          300: '#8A8A95',
          200: '#B8B8C2',
          100: '#E3E3EA',
        },
        accent: {
          DEFAULT: '#E6C36B',
          warm: '#E89968',
          cool: '#7FB6D0',
          deep: '#9B6BD8',
          alert: '#D86B6B',
          calm: '#6BC9A6',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Source Han Serif SC', 'Songti SC', 'serif'],
        sans: ['Inter', '"Noto Sans SC"', 'Source Han Sans SC', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
