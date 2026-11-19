/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        sans: ['Poppins', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#d6e2f0',
          200: '#a8c0dc',
          300: '#7a9ec8',
          400: '#4c7cb4',
          500: '#2d5f96',
          600: '#1e4a78',
          700: '#153a60',
          800: '#0C3547',
          900: '#071d2e',
          950: '#040f19',
        },
        pinoy: {
          blue: '#0C3547',
          'deep-blue': '#0a2d3d',
          gold: '#FFC107',
          'sun-yellow': '#FFD700',
          'warm-gold': '#FDB515',
          red: '#CE1126',
          'flag-red': '#CE1126',
          teal: '#1a7a7a',
          'tropical-green': '#2d8a4e',
          'ocean-blue': '#1565C0',
          'sky-blue': '#42A5F5',
          'sunset-orange': '#FF8C00',
          'mango': '#FFB347',
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      backgroundOpacity: {
        5: '0.05',
        10: '0.10',
        15: '0.15',
        20: '0.20',
        25: '0.25',
        35: '0.35',
        85: '0.85',
        95: '0.95',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
        'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.2)',
        'glow-gold': '0 0 20px rgba(255, 193, 7, 0.3)',
        'glow-blue': '0 0 20px rgba(21, 101, 192, 0.3)',
        'glow-sm': '0 0 10px rgba(255, 215, 0, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 193, 7, 0.1)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
