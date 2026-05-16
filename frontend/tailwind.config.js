/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Амири — арабский шрифт с огласовками
        arabic: ["'Amiri'", "serif"],
        // Noto Sans Arabic — запасной
        arabic2: ["'Noto Sans Arabic'", "sans-serif"],
      },
    },
  },
  plugins: [],
}

