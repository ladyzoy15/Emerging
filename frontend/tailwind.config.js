/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f3f9', 100: '#d9e0ed', 200: '#b3c1db', 300: '#8da2c9',
          400: '#6683b7', 500: '#4064a5', 600: '#335084', 700: '#263c63',
          800: '#1B2A4A', 900: '#0d1525'
        }
      }
    }
  },
  plugins: []
}
