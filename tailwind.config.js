/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: '#12151A',      // deep charcoal-navy, not pure black
          surface: '#1B2028',
          surface2: '#20262F',
          border: '#2A313C',
          text: '#EDEFF2',
          muted: '#8A92A0',
        },
        amber: {
          DEFAULT: '#E8A34D',  // copper/amber - brand accent (buttons, highlights)
          dim: '#8C6A3E',
        },
        on: {
          DEFAULT: '#4ADE80',  // vivid green - reserved for "this is ON" state only, never dimmed
        },
        danger: '#D9695F',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
};
