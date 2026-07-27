import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
    },
  },
  { ignores: ['dist/', 'node_modules/'] },
);
