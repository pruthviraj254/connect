/** Root ESLint — non-type-aware rules for workspace-wide consistency. */
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules',
    'dist',
    'out',
    '.next',
    '.vite',
    'coverage',
    'apps/desktop/src/renderer/components/ui',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    es2022: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'import/no-unresolved': 'off',
  },
};
