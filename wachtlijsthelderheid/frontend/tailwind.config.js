/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cream - Achtergrondkleuren (warm, uitnodigend)
        cream: {
          50: '#FDFBF7',   // Card achtergronden licht
          100: '#F7F3EC',  // Pagina-achtergrond, navbar, secties
          200: '#F0EADF',  // Hover-achtergronden
          300: '#E8DFD0',  // Borders, scheidingslijnen
          400: '#DDD2C0',
          500: '#D1C4AD',
        },
        // Forest - Primaire kleur (vertrouwen, professioneel)
        forest: {
          50: '#EDF3F1',
          100: '#D4E2DD',
          200: '#A8C5BA',
          300: '#7DA898',
          400: '#517B6E',
          500: '#2D5A4A',   // Primaire tekst, headings, navigatie
          600: '#264D3F',   // Hover states, section titles
          700: '#1E3F33',   // Donkere accenten
          800: '#173028',
          900: '#10221D',
        },
        // Terracotta - CTA kleur (warmte, actie)
        terracotta: {
          50: '#FDF5F0',
          100: '#FAEADE',
          200: '#F3D1B8',
          300: '#ECB892',
          400: '#D9956A',
          500: '#C67B4B',   // CTA-knoppen, primaire actieknoppen
          600: '#B56A3B',   // Hover state van CTA-knoppen
          700: '#955530',
          800: '#754325',
          900: '#5A331D',
        },
        // Teal - Accent kleur (frisheid, succes)
        teal: {
          50: '#EEF7F5',
          100: '#D5EDEA',
          200: '#ABDBD4',
          300: '#82C9BF',
          400: '#6BB8AD',
          500: '#5BA89D',   // Decoratieve accenten, succes-indicatoren
          600: '#4D8E84',   // Positieve percentages, status-indicators
          700: '#3E736B',
          800: '#305952',
          900: '#213F3A',
        },
        // Navy - Tekst tinten
        navy: {
          50: '#F7F3EC',
          100: '#F0EADF',
          200: '#E0D6C8',
          300: '#C5B8A5',
          400: '#9E9182',   // Labels, subtekst, meta-informatie
          500: '#6B6155',   // Body tekst, paragrafen, subtitels
          600: '#514A40',
          700: '#3A352E',   // Donkere tekst
          800: '#2A2621',
          900: '#1A1815',
        },
        // Semantic colors
        success: {
          50: '#EEF7F5',
          100: '#D5EDEA',
          500: '#5BA89D',
          600: '#4D8E84',
        },
        error: {
          50: '#FDF5F0',
          100: '#FAEADE',
          500: '#C67B4B',
          600: '#B56A3B',
        },
        warning: {
          50: '#FDF5F0',
          100: '#FAEADE',
          500: '#D9956A',
          600: '#C67B4B',
        },
        // Sidebar - Forest based
        sidebar: {
          DEFAULT: '#2D5A4A',  // Forest 500
          light: '#3A6B5A',    // Lighter for hover
          dark: '#1E3F33',     // Forest 700
          border: '#517B6E',   // Forest 400
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
