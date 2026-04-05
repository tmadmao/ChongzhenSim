module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@systems/(.*)$': '<rootDir>/src/systems/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx'
  ],
  collectCoverage: false,
  verbose: true,
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};