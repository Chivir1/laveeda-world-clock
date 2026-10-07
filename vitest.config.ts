// Not in tsconfig.json's `include`: vitest bundles its own vite copy, and the
// two Plugin types disagree for reasons that have nothing to do with this app.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
    reporters: ['default'],
  },
})
