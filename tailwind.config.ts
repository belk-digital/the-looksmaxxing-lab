import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        cream: {
          DEFAULT: '#FAF7F2',
          warm: '#F2EDE4',
          sand: '#ECE5D8',
          clay: '#E0D5C2',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#1A1A1A',
          muted: '#4A4A4A',
          subtle: '#8A8A8A',
        },
        gold: {
          DEFAULT: '#C9B58E',
          light: '#E5D8B8',
          dark: '#A89570',
          deep: '#8C7A55',
        },
        success: { DEFAULT: '#6B8E5E', bg: '#E8EFE3' },
        error: { DEFAULT: '#B85450', bg: '#F5E3E1' },
        warning: { DEFAULT: '#C4A05E', bg: '#F5EAD3' },
        info: { DEFAULT: '#6B7A8E', bg: '#E5E9EF' },
        border: {
          subtle: '#E8E2D5',
          DEFAULT: '#D6CDB8',
          strong: '#0A0A0A',
          gold: '#C9B58E',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bodoni 72', 'Didot', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display
        'display-xl': ['96px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['72px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-md': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['40px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        // Editorial
        'editorial-lg': ['32px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'editorial-md': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        // Body
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '-0.005em' }],
        'body-md': ['16px', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        'body-xs': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        // Labels (uppercase, tracked)
        'label-lg': ['14px', { lineHeight: '1.4', letterSpacing: '0.1em' }],
        'label-md': ['12px', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        'label-sm': ['10px', { lineHeight: '1.3', letterSpacing: '0.15em' }],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        md: '4px',
        lg: '8px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(10, 10, 10, 0.04)',
        md: '0 4px 12px rgba(10, 10, 10, 0.06)',
        lg: '0 12px 32px rgba(10, 10, 10, 0.08)',
        xl: '0 24px 64px rgba(10, 10, 10, 0.12)',
        focus: '0 0 0 3px rgba(201, 181, 142, 0.4)',
      },
      maxWidth: {
        content: '720px',
        prose: '960px',
        page: '1280px',
        wide: '1440px',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '200ms',
        base: '400ms',
        slow: '700ms',
        cinema: '1200ms',
      },
      zIndex: {
        sticky: '100',
        drawer: '200',
        modal: '300',
        toast: '400',
        tooltip: '500',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
