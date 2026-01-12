module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      keyframes: {
        'hint-fade': {
          '0%': { opacity: '0', transform: 'translateY(-2px)' },
          '10%': { opacity: '1', transform: 'translateY(0)' },
          '75%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(0)' },
        },
      },
      animation: {
        'hint-fade': 'hint-fade 4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
