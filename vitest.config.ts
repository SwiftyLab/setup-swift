import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    clearMocks: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage'
    }
  }
})
