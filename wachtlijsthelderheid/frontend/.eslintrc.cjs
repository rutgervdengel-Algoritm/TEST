module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh'],
  rules: {
    // Geen any types
    '@typescript-eslint/no-explicit-any': 'error',

    // Ongebruikte variabelen (prefix met _ mag)
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // React refresh
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Console.log niet in productie
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
