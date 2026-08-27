/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#C1D3E9',
        'slate-minimal': {
          DEFAULT: '#C1D3E9',
          ice: '#DEEDF2',
          blue: '#7EA9E6',
          soft: '#C0D4EF',
          charcoal: '#353A4B',
        },
        surface: '#111827',
        'surface-subtle': '#1F2937',
        'surface-border': '#374151',
        primary: {
          DEFAULT: '#10B981', // Emerald/FinTech accent
          hover: '#059669',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          glow: 'rgba(6, 182, 212, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
