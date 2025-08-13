module.exports = {
  env: {
    node: true,
  },
  extends: ['../../.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: true },
  ignorePatterns: ['.eslintrc.cjs', 'jest.config.js', './src/lib/graphql/generated.ts', 'dist/'],
  overrides: [
    {
      files: ['test.spec.ts'],
      env: { jest: true },
    },
  ],
};
