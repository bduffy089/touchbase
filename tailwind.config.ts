import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F0EFFE',
          100: '#E4E1FD',
          200: '#CCC7FB',
          300: '#A89EF8',
          400: '#8068F4',
          500: '#5E4AE3',
          600: '#4B35D1',
          700: '#3D27B5',
          800: '#332294',
          900: '#2C1E78',
          950: '#1A1048',
        },
        sand: {
          50:  '#FAFAF8',
          100: '#F5F4F1',
          200: '#EAE8E3',
          300: '#D8D5CE',
          400: '#B8B4AC',
          500: '#918D84',
          600: '#6E6A62',
          700: '#514E48',
          800: '#38352F',
          900: '#1E1C18',
          950: '#111009',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        'modal': '0 20px 60px -10px rgb(0 0 0 / 0.25)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
