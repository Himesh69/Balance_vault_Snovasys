/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          raised: 'var(--paper-raised)',
          sunk: 'var(--paper-sunk)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        rule: {
          DEFAULT: 'var(--rule)',
          strong: 'var(--rule-strong)',
        },
        green: {
          DEFAULT: 'var(--green)',
          hover: 'var(--green-hover)',
          wash: 'var(--green-wash)',
        },
        brass: {
          DEFAULT: 'var(--brass)',
          wash: 'var(--brass-wash)',
        },
        oxblood: {
          DEFAULT: 'var(--oxblood)',
          wash: 'var(--oxblood-wash)',
        },
        'slate-blue': {
          DEFAULT: 'var(--slate-blue)',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '4px', // Maximum allowed radius per spec §5
      },
      boxShadow: {
        hairline: '0 1px 0 0 var(--rule)',
        none: 'none',
      },
    },
  },
  plugins: [],
}
