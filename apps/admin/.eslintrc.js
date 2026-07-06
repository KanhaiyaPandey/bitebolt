module.exports = {
  extends: ['@bitebolt/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
  },
  settings: {
    react: { version: 'detect' },
    'import/ignore': ['react-native'],
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
  ],
  rules: {
    'react-native/no-color-literals': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
  },
};
