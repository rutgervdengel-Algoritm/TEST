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
        // Custom design system colors (Independer-like but own)
        primary: {
          DEFAULT: '#0B3A67',
          50: '#E8F0F7',
          100: '#D1E1EF',
          200: '#A3C3DF',
          300: '#75A5CF',
          400: '#4787BF',
          500: '#0B3A67',
          600: '#092E52',
          700: '#07233E',
          800: '#051729',
          900: '#020C15',
        },
        accent: {
          DEFAULT: '#1AAE6F',
          50: '#E8F8F1',
          100: '#D1F1E3',
          200: '#A3E3C7',
          300: '#75D5AB',
          400: '#47C78F',
          500: '#1AAE6F',
          600: '#158B59',
          700: '#106843',
          800: '#0B462C',
          900: '#052316',
        },
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F6F8FB',
        },
        border: {
          DEFAULT: '#E6EAF0',
        },
        text: {
          primary: '#0B1320',
          secondary: '#5A6472',
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
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 19, 32, 0.04), 0 1px 2px rgba(11, 19, 32, 0.06)',
        'card-hover': '0 4px 6px rgba(11, 19, 32, 0.07), 0 2px 4px rgba(11, 19, 32, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
