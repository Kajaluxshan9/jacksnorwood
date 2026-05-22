/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pub: {
          dark: '#1a1208',
          brown: '#3d2b1f',
          gold: '#b07a1a',
          cream: '#f5e6c8',
          red: '#8b1a1a',
          light: '#faf5ee',
          surface: '#ffffff',
          text: '#2d1a0e',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
