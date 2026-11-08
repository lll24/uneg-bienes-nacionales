/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uneg: {
          blue: '#002B49',
          gold: '#C59B27',
          light: '#F4F6F9',
          accent: '#0A4D68'
        }
      }
    },
  },
  plugins: [],
}

