module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/frontend'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    '@app/(.*)': '<rootDir>/frontend/src/app/$1',
    '@services/(.*)': '<rootDir>/frontend/src/app/services/$1',
    '@models/(.*)': '<rootDir>/frontend/src/app/models/$1',
    '@components/(.*)': '<rootDir>/frontend/src/app/components/$1',
    '@features/(.*)': '<rootDir>/frontend/src/app/features/$1',
    '@layouts/(.*)': '<rootDir>/frontend/src/app/layouts/$1',
    '@state/(.*)': '<rootDir>/frontend/src/app/state/$1'
  },
  collectCoverageFrom: [
    'frontend/src/app/**/*.ts',
    '!frontend/src/app/**/*.spec.ts',
    '!frontend/src/app/**/*.module.ts'
  ]
};