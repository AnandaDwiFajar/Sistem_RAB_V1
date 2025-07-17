// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto Mono', 'sans-serif'],
      },
      colors: {
        'industrial-light': '#f0f2f5', // Latar belakang utama
        'industrial-white': '#ffffff',
        'industrial-dark': '#333333', // Teks utama
        'industrial-gray': {
          light: '#d9d9d9', // Border
          DEFAULT: '#8c8c8c', // Teks sekunder
          dark: '#595959'
        },
        'industrial-accent': { // Mengganti kuning/oranye sebelumnya
          DEFAULT: '#005f73', // Biru baja
          dark: '#003d4a'
        },
        'industrial-warning': '#ff6700' // Oranye untuk peringatan/logout
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};