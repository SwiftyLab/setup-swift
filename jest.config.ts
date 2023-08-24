import type {Config} from 'jest'

export default (): Config => {
  return {
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: ['./src/**']
  }
}
