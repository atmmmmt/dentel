/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
        english: ['Inter', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        dark: 'var(--color-dark)',
        'dark-2': '#1C1C1E',
        muted: 'var(--color-muted)',
        // VIP template colors (Ayham design)
        cream: {
          DEFAULT: '#F8F7F4',
          dark: '#F0EDE6',
        },
        charcoal: {
          DEFAULT: '#1A1A1A',
          light: '#6B6B6B',
        },
        silver: {
          DEFAULT: '#B8B4AC',
          light: '#E8E5E0',
          dark: '#8A8178',
        },
        accent: '#C9A96E',
        border: '#E8E5E0',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        card: '1.25rem',
        btn: '0.875rem',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
