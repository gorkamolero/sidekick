/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ableton-dark': '#1e1e1e',
        'ableton-gray': '#2b2b2b',
        'ableton-blue': '#0084ff',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}