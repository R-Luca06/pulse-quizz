/**
 * PATCH for: tailwind.config.js
 *
 * Merge the keys below into your existing `theme.extend` block.
 */

module.exports = {
  theme: {
    extend: {
      colors: {
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
      keyframes: {
        'ember-rise': {
          '0%':   { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '15%':  { opacity: '1' },
          '100%': {
            transform: 'translateY(-120%) translateX(var(--ember-drift, 8px))',
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
        'sun-rays': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%':      { transform: 'rotate(8deg) scale(1.04)' },
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
        'phoenix-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-3px) rotate(-1.5deg)' },
        },
        'horizon-pulse': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.03)' },
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
        // Only add this if `stroke-flow` doesn't already exist.
        // If it does, re-use the existing definition.
        'stroke-flow': {
          from: { strokeDashoffset: '0' },
          to:   { strokeDashoffset: '-204' },
        },
      },
      animation: {
        'ember-rise':     'ember-rise 9s linear infinite',
        'ember-flicker':  'ember-flicker 2.2s ease-in-out infinite',
        'sun-rays':       'sun-rays 3.5s ease-in-out infinite',
        'heat-shimmer':   'heat-shimmer 3s ease-in-out infinite',
        'solar-shine':    'solar-shine 4s ease-in-out infinite',
        'phoenix-float':  'phoenix-float 3.5s ease-in-out infinite',
        'horizon-pulse':  'horizon-pulse 5s ease-in-out infinite',
        'solar-pulse':    'solar-pulse 2.5s ease-in-out infinite',
      },
    },
  },
};
