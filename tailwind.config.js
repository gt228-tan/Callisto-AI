/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Callisto Jovian base palette (dynamic light/dark mode variables)
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          panel: 'rgb(var(--bg-panel) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          border: 'rgb(var(--bg-border) / <alpha-value>)',
          hover: 'rgb(var(--bg-hover) / <alpha-value>)',
          subtle: 'rgb(var(--bg-subtle) / <alpha-value>)',
        },
        // Callisto celestial & Jovian thematic tokens
        callisto: {
          space: '#05080e',
          ice: '#38bdf8',
          'ice-glow': '#7dd3fc',
          'ice-dim': '#082f49',
          crater: '#64748b',
          regolith: '#334155',
          jovian: '#f59e0b',
          'jovian-warm': '#d97706',
          deep: '#0a0f1d',
        },
        // Amber accent (Jovian radiation & action brand)
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Semantic Splunk enterprise telemetry colors
        success: {
          dim: '#062817',
          DEFAULT: '#10b981',
          bright: '#34d399',
        },
        danger: {
          dim: '#2a0e12',
          DEFAULT: '#ef4444',
          bright: '#f87171',
        },
        warning: {
          dim: '#2b1b04',
          DEFAULT: '#f59e0b',
          bright: '#fbbf24',
        },
        info: {
          dim: '#08213a',
          DEFAULT: '#38bdf8',
          bright: '#7dd3fc',
        },
        // Clean text hierarchy with high legibility (dynamic light/dark mode variables)
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          accent: 'rgb(var(--text-accent) / <alpha-value>)',
          jovian: 'rgb(var(--text-jovian) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '3xs': ['0.625rem', { lineHeight: '0.85rem' }],
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
        xs:   ['0.75rem',   { lineHeight: '1.1rem' }],
        sm:   ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        sidebar: '240px',
        'sidebar-collapsed': '56px',
        topbar: '52px',
      },
      boxShadow: {
        'callisto-card': '0 4px 20px -2px rgba(3, 7, 18, 0.65), 0 0 0 1px rgba(30, 43, 66, 0.6)',
        'callisto-hover': '0 8px 30px -4px rgba(3, 7, 18, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.3)',
        'callisto-glow': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
        'jovian-glow': '0 0 25px -5px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.22s ease-out',
        'slide-in-left': 'slideInLeft 0.22s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'stream-in': 'streamIn 0.25s ease-out',
        'spin-slow': 'spin 20s linear infinite',
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
          from: { opacity: '0', transform: 'translateY(-3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        streamIn: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
    },
  },
  plugins: [],
}
