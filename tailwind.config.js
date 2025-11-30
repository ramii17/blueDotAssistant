/** @type {import('tailwindcss').Config} */
export default {
  // 🎯 FIX: Add the paths to your source files here
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome palette: pure black & white focused
        gray: {
          50: '#ffffff',
          100: '#f7f7f7',
          200: '#e6e6e6',
          300: '#cfcfcf',
          400: '#a9a9a9',
          500: '#7f7f7f',
          600: '#5b5b5b',
          700: '#3b3b3b',
          800: '#1a1a1a',
          900: '#000000'
        },
        primary: {
          DEFAULT: '#000000',
          50: '#ffffff',
          100: '#fafafa',
          200: '#efefef',
          300: '#d9d9d9',
          400: '#bfbfbf',
          500: '#000000',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000'
        },
        accent: {
          white: '#ffffff',
          black: '#000000'
        }
      }
    },
  },
  plugins: [],
}