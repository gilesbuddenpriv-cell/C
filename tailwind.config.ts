import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F0EDE5',
        'grid-line': '#D4CFC6',
        forest: {
          DEFAULT: '#1B5E42',
          light: '#2D7A57',
          pale: '#E8F5EE',
        },
        amber: {
          DEFAULT: '#B07D20',
          bg: '#FDF3D0',
          border: '#E6C96A',
        },
        card: '#FAFAF7',
        border: '#E0DBD3',
        ink: '#1A1A1A',
        muted: '#6B6560',
      },
      fontFamily: {
        serif: ['"Libre Baskerville"', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(212,207,198,0.45) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,207,198,0.45) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
}

export default config
