/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        secondary: '#27272a',
      },
      textColor: {
        DEFAULT: '#111827',
        dark: '#ffffff',
      }
    }
  },
  plugins: [],
}; 