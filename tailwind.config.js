/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        saffron: { 50:'#fff7f0', 100:'#ffe4cc', 200:'#ffc999', 300:'#ffad66', 400:'#ff8533', 500:'#e8520a', DEFAULT:'#e8520a', 600:'#cc4400', 700:'#993300', 800:'#662200', 900:'#331100' },
        navy:    { 50:'#f0f2ff', 100:'#d9ddff', 200:'#b3bcff', 300:'#8d9aff', 400:'#6779e8', 500:'#2e3da8', DEFAULT:'#2e3da8', 600:'#253296', 700:'#1c2575', 800:'#121854', 900:'#090d2e' },
        cream:   { DEFAULT:'#f0ebe1', 50:'#faf8f4', 100:'#f5f0e8', 200:'#ede4d2', 300:'#e0d4bb' },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        float: { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
