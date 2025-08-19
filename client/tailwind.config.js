/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        'apple-purple': '#C084FC',
        'apple-purple-light': '#DDD6FE',
        'apple-purple-dark': '#A855F7',
        'apple-gray': {
          1: '#8E8E93',
          2: '#AEAEB2',
          3: '#C7C7CC',
          4: '#D1D1D6',
          5: '#E5E5EA',
          6: '#F2F2F7',
        },
        'apple-label': '#000000',
        'apple-secondary-label': 'rgba(60, 60, 67, 0.6)',
        'apple-tertiary-label': 'rgba(60, 60, 67, 0.3)',
        'apple-separator': 'rgba(60, 60, 67, 0.29)',
        'apple-system-background': '#FFFFFF',
        'apple-secondary-background': '#F2F2F7',
      },
      backdropBlur: {
        'xl': '24px',
      },
      animation: {
        'heartbeat': 'heartbeat 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}