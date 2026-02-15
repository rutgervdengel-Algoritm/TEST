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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Main primary
          600: '#2563eb',  // Primary hover
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Main secondary
          600: '#d97706',  // Secondary hover
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          900: '#065f46',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          900: '#991b1b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          900: '#92400e',
        },
        surface: '#fef3c7',  // Amber-100 voor subtiele achtergronden
        sidebar: {
          DEFAULT: '#1e3a8a',  // primary-900
          light: '#1e40af',   // primary-800
          dark: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',   // Buttons, inputs
        'md': '12px',  // Cards
        'lg': '16px',  // Modals, large containers
      },
    },
  },
  plugins: [],
}
