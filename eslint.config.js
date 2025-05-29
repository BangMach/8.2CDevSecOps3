import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      // your custom rules here
      'no-unused-vars': 'warn',
      'no-console': 'off',
    }
  }
];