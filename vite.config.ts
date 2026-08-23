/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Scope to this app's own sources. personal-site/ is a separate, dependency-free
    // project whose tests run on Node's built-in runner, and Vitest's default glob
    // would otherwise try to collect them.
    include: ['src/**/*.test.ts'],
  },
})
