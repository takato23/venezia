/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Paleta principal - Tonos crema y café suaves
        venezia: {
          50: '#fdfcfb',
          100: '#faf8f5',
          200: '#f4ede4',
          300: '#e8dcc9',
          400: '#d4c4a8',
          500: '#c2a878',
          600: '#a78b5f',
          700: '#87704d',
          800: '#6b5940',
          900: '#594936',
        },
        // Acento principal - Rosa suave/malva
        accent: {
          50: '#fdf4f7',
          100: '#fce8ef',
          200: '#f9d1df',
          300: '#f4a9c3',
          400: '#ec799f',
          500: '#e14d7b',
          600: '#cc3060',
          700: '#ac244c',
          800: '#912041',
          900: '#7a1e39',
        },
        // Secundario - Verde salvia suave
        sage: {
          50: '#f6f9f6',
          100: '#e9f0e9',
          200: '#d4e1d4',
          300: '#b1c7b1',
          400: '#87a687',
          500: '#648564',
          600: '#4e6a4e',
          700: '#415641',
          800: '#364536',
          900: '#2e3a2e',
        },
        // Neutros cálidos personalizados
        warm: {
          50: '#faf9f7',
          100: '#f3f1ed',
          200: '#e8e3db',
          300: '#d7cfc2',
          400: '#bfb3a1',
          500: '#a69583',
          600: '#8b7968',
          700: '#726356',
          800: '#5e5249',
          900: '#4f453f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fredoka One', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};