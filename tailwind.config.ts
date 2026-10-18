import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ivory: 'rgb(var(--c-bg) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        arabic: ['Amiri', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.5rem' },
      boxShadow: { soft: '0 10px 40px -12px rgb(var(--c-shadow) / 0.25)' },
    },
  },
} satisfies Config;
