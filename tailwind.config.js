/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#050505',
          neon: '#00f2ff',
          pink: '#ff00ff',
          green: '#4ade80',
          yellow: '#fde047',
          purple: '#9d4edd',
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
