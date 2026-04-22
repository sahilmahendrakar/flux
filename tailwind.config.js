/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        flux: {
          bg: 'rgb(var(--color-flux-bg) / <alpha-value>)',
          sidebar: 'rgb(var(--color-flux-sidebar) / <alpha-value>)',
          column: 'rgb(var(--color-flux-column) / <alpha-value>)',
          surface: 'rgb(var(--color-flux-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-flux-elevated) / <alpha-value>)',
          card: 'rgb(var(--color-flux-card) / <alpha-value>)',
          'card-hover': 'rgb(var(--color-flux-card-hover) / <alpha-value>)',
          'card-active': 'rgb(var(--color-flux-card-active) / <alpha-value>)',
          line: 'rgb(var(--color-flux-line) / <alpha-value>)',
          'line-strong': 'rgb(var(--color-flux-line-strong) / <alpha-value>)',
          tint: 'rgb(var(--color-flux-tint) / <alpha-value>)',
          fg: 'rgb(var(--color-flux-fg) / <alpha-value>)',
          'fg-soft': 'rgb(var(--color-flux-fg-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-flux-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-flux-subtle) / <alpha-value>)',
          pill: 'rgb(var(--color-flux-pill) / <alpha-value>)',
        },
      },
      boxShadow: {
        'flux-detail': 'var(--flux-shadow-detail)',
        'flux-modal': 'var(--flux-shadow-modal)',
      },
    },
  },
  plugins: [],
};
