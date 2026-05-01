/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a5f',
        },
        record: '#ef4444',
      },
    },
  },
}
