/** @type {import('jest').Config} */

const config = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^electron$': '<rootDir>/__mocks__/electron.js'
  },
  setupFiles: ['<rootDir>/jest.setup.js']
};

module.exports = config