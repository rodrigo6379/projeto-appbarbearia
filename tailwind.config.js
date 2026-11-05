/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#060a12',
          900: '#0a1018',
          850: '#0e1620',
          800: '#121c28',
          750: '#16202e',
          700: '#1b2735',
          600: '#243245',
          500: '#314253',
        },
        electric: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#b4d8ff',
          300: '#7ec0ff',
          400: '#3aa3ff',
          500: '#1685ff',
          600: '#0a6fd9',
          700: '#085ab0',
          800: '#0a4a8c',
          900: '#0c3d72',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
