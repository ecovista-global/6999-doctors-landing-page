/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/scratch/**'
    ]
  },
  {
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
        }
      ]
    }
  }
];
