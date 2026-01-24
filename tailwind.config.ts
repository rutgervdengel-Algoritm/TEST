import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Independer design system colors
        primary: {
          DEFAULT: '#5B0A91',
          50: '#F5F3F7',
          100: '#EBE7F0',
          200: '#D7CFE1',
          300: '#C3B7D2',
          400: '#AF9FC3',
          500: '#5B0A91',
          600: '#490874',
          700: '#370657',
          800: '#25043A',
          900: '#12021D',
        },
        accent: {
          DEFAULT: '#FFD700',
          50: '#FFFDF0',
          100: '#FFFBE0',
          200: '#FFF7C2',
          300: '#FFF3A3',
          400: '#FFEF85',
          500: '#FFD700',
          600: '#CCAC00',
          700: '#998100',
          800: '#665600',
          900: '#332B00',
        },
        success: {
          DEFAULT: '#00A878',
          50: '#E6F7F2',
          100: '#CCEFE5',
          200: '#99DFCB',
          300: '#66CFB1',
          400: '#33BF97',
          500: '#00A878',
          600: '#008660',
          700: '#006548',
          800: '#004330',
          900: '#002218',
        },
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F3F7',
          tertiary: '#F8F6FA',
        },
        badge: {
          blue: '#D4F1F4',
          'blue-dark': '#0891B2',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        text: {
          primary: '#2D1B45',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        container: '1120px',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        card: '0.875rem', // 14px
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        subtle: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
