/**
 * Root Jest Configuration
 * Runs tests across all sub-projects with proper TypeScript support
 */

module.exports = {
  // Use projects to run each sub-project with its own configuration
  projects: [
    '<rootDir>/project-analyzer',
    '<rootDir>/project-manager',
    '<rootDir>/project-planner',
    '<rootDir>/shared'
  ],

  // Global coverage configuration
  collectCoverageFrom: [
    '*/src/**/*.{ts,js}',
    '!*/src/**/*.d.ts',
    '!*/node_modules/**',
    '!*/dist/**'
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'text-summary'],

  // Ignore these directories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/archive/',
    '/memory-bank/',
    '/dashboard/'
  ],

  // Show verbose output
  verbose: true
};
