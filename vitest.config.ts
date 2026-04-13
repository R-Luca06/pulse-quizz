import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Remplace framer-motion par un stub passthrough sans animation.
      // Évite les timeouts causés par les 130+ motion.circle repeat:Infinity
      // de ConstellationBackground dans jsdom.
      // fileURLToPath décode correctement les espaces (%20) dans le chemin.
      'framer-motion': fileURLToPath(new URL('./src/test/__mocks__/framer-motion.tsx', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
