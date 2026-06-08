/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@bitebolt/eslint-config'],
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // NestJS decorators rely on parameter properties
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
