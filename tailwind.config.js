/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark enterprise base palette
        bg: {
          primary: '#0d0f14',
          secondary: '#111318',
          panel: '#161a22',
          card: '#1c2130',
          border: '#252b38',
          hover: '#1e2536',
        },
        // Amber accent (primary brand)
        amber: {
          50:  '#fff8eb',
          100: '#ffefc7',
          200: '#ffda8a',
          300: '#ffc04d',
          400: '#ffa61f',
          500: '#f08000',
          600: '#cc6300',
          700: '#a14800',
          800: '#843b00',
          900: '#6e3200',
        },
        // Semantic colors
        success: {
          dim: '#0d2419',
          DEFAULT: '#22c55e',
          bright: '#4ade80',
        },
        danger: {
          dim: '#2d0e0e',
          DEFAULT: '#ef4444',
          bright: '#f87171',
        },
        warning: {
          dim: '#261c00',
          DEFAULT: '#f59e0b',
          bright: '#fcd34d',
        },
        info: {
          dim: '#0a1929',
          DEFAULT: '#3b82f6',
          bright: '#60a5fa',
        },
        // Text hierarchy
        text: {
          primary: '#e8ecf4',
          secondary: '#8b95a8',
          muted: '#545f72',
          accent: '#f08000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:   ['0.6875rem', { lineHeight: '1rem' }],
        sm:   ['0.75rem',   { lineHeight: '1.1rem' }],
      },
      spacing: {
        sidebar: '240px',
        'sidebar-collapsed': '56px',
        topbar: '48px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'stream-in': 'streamIn 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',      opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        streamIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
