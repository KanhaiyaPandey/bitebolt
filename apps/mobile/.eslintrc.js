/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@bitebolt/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    jest: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'coverage/',
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
    'jest.setup.ts',
  ],
};
