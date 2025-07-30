/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/templates/**/*.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        venezia: {
          // Ice Cream Inspired Main Palette - Creamy Vanilla Base
          50: '#fffbf7',   // Lightest cream
          100: '#fef7ed',  // Vanilla cream
          200: '#fdebd0',  // Soft cream
          300: '#fbd8a5',  // Light caramel
          400: '#f8b968',  // Golden caramel
          500: '#f59e0b',  // Rich caramel
          600: '#d97706',  // Deep caramel
          700: '#b45309',  // Chocolate caramel
          800: '#92400e',  // Dark chocolate
          900: '#78350f',  // Espresso
          950: '#451a03',  // Dark roast
        },
        primary: {
          // Strawberry Pink Accent
          50: '#fdf2f8',   // Lightest pink
          100: '#fce7f3',  // Soft pink
          200: '#fbcfe8',  // Light strawberry
          300: '#f9a8d4',  // Medium strawberry
          400: '#f472b6',  // Vibrant strawberry
          500: '#ec4899',  // Main strawberry
          600: '#db2777',  // Deep strawberry
          700: '#be185d',  // Rich berry
          800: '#9d174d',  // Dark berry
          900: '#831843',  // Deep berry
          950: '#500724',  // Darkest berry
        },
        // Ice Cream Flavor Palette
        mint: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',  // Main mint
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        chocolate: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#977669',
          800: '#846358',
          900: '#43302b',  // Main chocolate
          950: '#292524',
        },
        pistachio: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',  // Main pistachio
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
          950: '#1a2e05',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        }
      },
      fontFamily: {
        sans: [
          'Poppins',
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        display: [
          'Fredoka One',
          'Poppins',
          'cursive'
        ],
        body: [
          'Nunito',
          'Poppins',
          'sans-serif'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'minimal': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'minimal-lg': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Ice cream themed animations
        'scoop-bounce': 'scoopBounce 0.6s ease-in-out',
        'melt-gentle': 'meltGentle 2s ease-in-out infinite',
        'swirl': 'swirl 3s linear infinite',
        'wobble-soft': 'wobbleSoft 1.5s ease-in-out infinite',
        'cream-drip': 'creamDrip 0.8s ease-out',
        'flavor-pulse': 'flavorPulse 2.5s ease-in-out infinite',
        'freeze-in': 'freezeIn 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        // Ice cream themed keyframes
        scoopBounce: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '30%': { transform: 'translateY(-8px) scale(1.05)' },
          '60%': { transform: 'translateY(-4px) scale(1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        meltGentle: {
          '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
          '50%': { transform: 'translateY(1px) scaleY(0.98)' },
        },
        swirl: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        wobbleSoft: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        creamDrip: {
          '0%': { transform: 'translateY(-10px) scaleY(0)', opacity: '0' },
          '50%': { transform: 'translateY(0) scaleY(1.1)', opacity: '1' },
          '100%': { transform: 'translateY(5px) scaleY(1)', opacity: '0.8' },
        },
        flavorPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(236, 72, 153, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(236, 72, 153, 0)' },
        },
        freezeIn: {
          '0%': { 
            transform: 'scale(0.8) translateY(20px)',
            opacity: '0',
            filter: 'blur(4px)'
          },
          '100%': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1',
            filter: 'blur(0px)'
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 