import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ESLint } from 'eslint';

describe('MT-002: ESLint rule bans verification', () => {
  const eslint = new ESLint({
    overrideConfigFile: new URL('../eslint.config.js', import.meta.url).pathname
  });

  it('bans top-level let per SD-080', async () => {
    const code = 'let mutableGlobal = 42;\nexport { mutableGlobal };\n';
    const results = await eslint.lintText(code, { filePath: 'test-top-level-let.js' });
    const hasBan = results[0]?.messages.some((m) =>
      m.message.includes('Top-level `let` is banned')
    );
    assert.strictEqual(hasBan, true, 'Top-level let must trigger lint error');
  });

  it('bans dangerouslySetInnerHTML per SD-042', async () => {
    const code = 'const Component = () => ({ dangerouslySetInnerHTML: { __html: "<script></script>" } });\nexport default Component;\n';
    const results = await eslint.lintText(code, { filePath: 'test-xss.js' });
    const hasBan = results[0]?.messages.some((m) =>
      m.message.includes('dangerouslySetInnerHTML is strictly banned')
    );
    assert.strictEqual(hasBan, true, 'dangerouslySetInnerHTML must trigger lint error');
  });

  it('bans raw string concatenation in db.execute per SD-042', async () => {
    const code = 'const runQuery = (db, table) => db.execute("SELECT * FROM " + table);\nexport { runQuery };\n';
    const results = await eslint.lintText(code, { filePath: 'test-sqli.js' });
    const hasBan = results[0]?.messages.some((m) =>
      m.message.includes('SQL injection prevention')
    );
    assert.strictEqual(hasBan, true, 'Raw SQL string concatenation must trigger lint error');
  });

  it('bans template literal interpolation in db.execute per SD-042', async () => {
    const code = 'const runQuery = (db, table) => db.execute(`SELECT * FROM ${table}`);\nexport { runQuery };\n';
    const results = await eslint.lintText(code, { filePath: 'test-sqli-template.js' });
    const hasBan = results[0]?.messages.some((m) =>
      m.message.includes('SQL injection prevention')
    );
    assert.strictEqual(hasBan, true, 'Template literal interpolation in db.execute must trigger lint error');
  });
});
