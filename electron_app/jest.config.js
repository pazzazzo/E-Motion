/** @type {import('jest').Config} */

const config = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^electron$': '<rootDir>/__mocks__/electron.js'
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  silent: true
};

module.exports = config