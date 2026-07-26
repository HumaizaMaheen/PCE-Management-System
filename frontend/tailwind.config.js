/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006A4E',
          light: '#008F6A',
          dark: '#004C38',
        },
        secondary: '#FFFFFF',
        accent: {
          DEFAULT: '#C8A951',
          light: '#DCC37E',
          dark: '#AA8A30',
        },
        background: '#F7F9FA',
        customText: '#333333',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        card: '12px',
      }
    },
  },
  plugins: [],
}
