/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Color principal de Blume
        primary: {  
          DEFAULT: '#ea2a33',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ea2a33',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Backgrounds
        'background-light': '#f8f6f6',
        'background-dark': '#211111',
        
        // Cards
        'card-light': '#FFFFFF',
        'card-dark': '#424242',
        
        // Text colors - Light mode
        'text-primary-light': '#1b0e0e',
        'text-secondary-light': '#994d51',
        
        // Text colors - Dark mode
        'text-primary-dark': '#fcf8f8',
        'text-secondary-dark': '#e7d0d1',
        
        // Borders
        'border-light': '#f3e7e8',
        'border-dark': '#3a2626',
        
        // Status colors for availability
        available: '#A5D6A7',
        limited: '#FFF59D',
        unavailable: '#E0E0E0',
        
        // Success, Warning, Error
        success: {
          DEFAULT: '#48BB78',
          light: '#9AE6B4',
          dark: '#276749',
        },
        warning: {
          DEFAULT: '#ECC94B',
          light: '#F6E05E',
          dark: '#975A16',
        },
        error: {
          DEFAULT: '#F56565',
          light: '#FC8181',
          dark: '#C53030',
        },
      },
      
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',     // 4px
        DEFAULT: '0.5rem',   // 8px
        'md': '0.5rem',      // 8px
        'lg': '0.75rem',     // 12px
        'xl': '1rem',        // 16px
        '2xl': '1.5rem',     // 24px
        'full': '9999px',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      
      transitionDuration: {
        '0': '0ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}