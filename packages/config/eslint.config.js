import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/scratch/**',
      '**/.turbo/**',
      '**/tests/fixtures/violating/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program > VariableDeclaration[kind="let"]',
          message: 'Top-level `let` is banned per SD-080 thread safety constraints. Use immutable constants or per-request contexts.'
        },
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'dangerouslySetInnerHTML is strictly banned per 10 § SD-042 XSS prevention.'
        },
        {
          selector: 'Property[key.name="dangerouslySetInnerHTML"]',
          message: 'dangerouslySetInnerHTML is strictly banned per 10 § SD-042 XSS prevention.'
        },
        {
          selector: 'CallExpression[callee.property.name="execute"][arguments.0.type="BinaryExpression"]',
          message: 'Raw string concatenation in db.execute is banned per 10 § SD-042 SQL injection prevention. Use parameterized queries or Drizzle query builder.'
        },
        {
          selector: 'CallExpression[callee.property.name="execute"][arguments.0.type="TemplateLiteral"][arguments.0.expressions.length>0]',
          message: 'Template literal interpolation in db.execute is banned per 10 § SD-042 SQL injection prevention. Use sql`` template tag or Drizzle query builder.'
        },
        {
          selector: 'CallExpression[callee.property.name="query"][arguments.0.type="BinaryExpression"]',
          message: 'Raw string concatenation in db.query is banned per 10 § SD-042 SQL injection prevention.'
        },
        {
          selector: 'CallExpression[callee.property.name="query"][arguments.0.type="TemplateLiteral"][arguments.0.expressions.length>0]',
          message: 'Template literal interpolation in db.query is banned per 10 § SD-042 SQL injection prevention.'
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }
      ]
    }
  }
];
