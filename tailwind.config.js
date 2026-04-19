/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Safelist — keyframes emitted via inline `style={{ animation: 'name ...' }}`
  // (no `animate-*` class in source). Without this, Tailwind purges the
  // @keyframes definitions and the inline `animation:` has nothing to reference.
  safelist: [
    'animate-ember-rise',
    'animate-ember-flicker',
    'animate-sun-rays',
    'animate-heat-shimmer',
    'animate-solar-shine',
    'animate-phoenix-float',
    'animate-horizon-pulse',
    'animate-solar-pulse',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          violet: '#8B5CF6',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          pink: '#EC4899',
          gold: '#EAB308',
        },
        game: {
          bg: '#0A0A0F',
          card: '#13131F',
          border: '#1E1E2E',
          success: '#22C55E',
          danger: '#EF4444',
          warning: '#F97316',
        },
        solar: {
          50:  '#fef9c3',
          100: '#fef08a',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          ember: '#ea580c',
          deep:  '#431407',
        },
      },
      boxShadow: {
        'neon-violet': '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)',
        'neon-green': '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.2)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.2)',
        'neon-gold': '0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.2)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        // Badge tier animations (used in MiniBadge + AchievementsPage via Framer Motion animate strings)
        'badge-fire':     'badge-fire 1.8s ease-in-out infinite',
        'badge-electric': 'badge-electric 1.4s ease-in-out infinite',
        'badge-gold':     'badge-gold 2.5s ease-in-out infinite',
        'badge-prismatic':'badge-prismatic 3s linear infinite',
        // Set Solaire — Héliarque (Vol. 01)
        'ember-rise':     'ember-rise 9s linear infinite',
        'ember-flicker':  'ember-flicker 2.2s ease-in-out infinite',
        'sun-rays':       'sun-rays 3.5s ease-in-out infinite',
        'heat-shimmer':   'heat-shimmer 3s ease-in-out infinite',
        'solar-shine':    'solar-shine 4s ease-in-out infinite',
        'phoenix-float':  'phoenix-float 3.5s ease-in-out infinite',
        'horizon-pulse':  'horizon-pulse 5s ease-in-out infinite',
        'solar-pulse':    'solar-pulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)' },
        },
        'badge-fire': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px #f9731680) drop-shadow(0 0 8px #ef444440)' },
          '50%':       { filter: 'drop-shadow(0 0 8px #f97316cc) drop-shadow(0 0 16px #ef444460) drop-shadow(0 0 24px #f9731630)' },
        },
        'badge-electric': {
          '0%, 100%': { filter: 'drop-shadow(0 0 3px #8b5cf670) drop-shadow(0 0 6px #3b82f640)' },
          '40%':       { filter: 'drop-shadow(0 0 7px #a78bfacc) drop-shadow(0 0 14px #3b82f660) drop-shadow(0 0 20px #6366f130)' },
          '65%':       { filter: 'drop-shadow(0 0 2px #8b5cf650) drop-shadow(0 0 4px #3b82f630)' },
        },
        'badge-gold': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px #f59e0b80) drop-shadow(0 0 8px #eab30840)' },
          '50%':       { filter: 'drop-shadow(0 0 8px #fbbf24cc) drop-shadow(0 0 18px #eab30860) drop-shadow(0 0 28px #f59e0b30)' },
        },
        'badge-prismatic': {
          '0%':     { filter: 'drop-shadow(0 0 6px #f43f5eaa) drop-shadow(0 0 12px #f43f5e40)' },
          '16.6%':  { filter: 'drop-shadow(0 0 6px #f97316aa) drop-shadow(0 0 12px #f9731640)' },
          '33.3%':  { filter: 'drop-shadow(0 0 6px #eab308aa) drop-shadow(0 0 12px #eab30840)' },
          '50%':    { filter: 'drop-shadow(0 0 6px #22c55eaa) drop-shadow(0 0 12px #22c55e40)' },
          '66.6%':  { filter: 'drop-shadow(0 0 6px #3b82f6aa) drop-shadow(0 0 12px #3b82f640)' },
          '83.3%':  { filter: 'drop-shadow(0 0 6px #8b5cf6aa) drop-shadow(0 0 12px #8b5cf640)' },
          '100%':   { filter: 'drop-shadow(0 0 6px #f43f5eaa) drop-shadow(0 0 12px #f43f5e40)' },
        },
        // ── Set Solaire — Héliarque (Vol. 01) ────────────────────────────────
        // NOTE: `stroke-flow` / `stroke-flow-b` are declared globally in src/index.css
        // — do not duplicate them here.
        'ember-rise': {
          // `%` in translateY is relative to the element itself (2–6px embers)
          // → use vh so particles traverse the full viewport height.
          '0%':   { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '15%':  { opacity: '1' },
          '100%': {
            transform: 'translateY(-120vh) translateX(var(--ember-drift, 8px))',
            opacity: '0',
          },
        },
        'ember-flicker': {
          '0%, 100%': {
            filter:
              'drop-shadow(0 0 4px #fbbf24) drop-shadow(0 0 12px #f59e0b88)',
          },
          '50%': {
            filter:
              'drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 22px #f59e0bcc) drop-shadow(0 0 32px #ea580c60)',
          },
        },
        'phoenix-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-3px) rotate(-1.5deg)' },
        },
        'horizon-pulse': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.03)' },
        },
        'heat-shimmer': {
          '0%, 100%': { transform: 'translateX(0)', opacity: '0.3' },
          '50%':      { transform: 'translateX(2px)', opacity: '0.6' },
        },
        'solar-shine': {
          '0%':   { backgroundPosition: '-200% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'card-shine-sweep': {
          '0%':   { transform: 'translateX(-120%)' },
          '60%':  { transform: 'translateX(240%)' },
          '100%': { transform: 'translateX(240%)' },
        },
        'solar-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%':      { opacity: '1' },
        },
        'solar-spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'solar-spin-rev': {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        'sun-rays': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%':      { transform: 'rotate(8deg) scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
}
