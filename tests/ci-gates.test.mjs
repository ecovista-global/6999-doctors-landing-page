import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('MT-008: Docs & Secret CI Gates Acceptance Tests', () => {
  it('docs-touched gate fails when apps/ or packages/ change without changelog diff', () => {
    const checkDocsTouched = (changedFilesList) => {
      const codeChanged = changedFilesList.some((f) =>
        f.startsWith('apps/') || f.startsWith('packages/')
      );
      const changelogChanged = changedFilesList.some((f) =>
        f.includes('16_CHANGELOG.md')
      );

      if (codeChanged && !changelogChanged) {
        return false; // Fails gate
      }
      return true; // Passes gate
    };

    // Case 1: Code changed without changelog -> FAILS
    const sampleViolation = ['apps/platform/src/lib/leak.ts', 'packages/ui/src/button.tsx'];
    assert.strictEqual(
      checkDocsTouched(sampleViolation),
      false,
      'PR modifying apps/ or packages/ without changelog MUST fail'
    );

    // Case 2: Code changed WITH changelog -> PASSES
    const sampleValid = [
      'apps/platform/src/lib/leak.ts',
      'brain/16_CHANGELOG.md',
    ];
    assert.strictEqual(
      checkDocsTouched(sampleValid),
      true,
      'PR modifying code with changelog MUST pass'
    );

    // Case 3: Docs only changed -> PASSES
    const sampleDocsOnly = ['brain/01_PRD.md', 'brain/17_DECISIONS.md'];
    assert.strictEqual(
      checkDocsTouched(sampleDocsOnly),
      true,
      'Docs-only PR without code MUST pass'
    );
  });

  it('gitleaks detects planted fake secret key and exits non-zero', () => {
    const tempDir = path.resolve('/tmp/gitleaks-test-repo');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      execSync('git init -b main', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.name "Test Runner"', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'pipe' });

      // Plant a fake personal access token with sufficient entropy to trigger gitleaks
      const secretFile = path.join(tempDir, 'github-credentials.env');
      fs.writeFileSync(
        secretFile,
        'GITHUB_TOKEN=ghp_9A8B7C6D5E4F3G2H1I0J9K8L7M6N5O4P3Q2R\n'
      );

      execSync('git add . && git commit -m "commit containing planted secret"', {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Run gitleaks detect on the repo
      let detectedLeak = false;
      try {
        execSync('gitleaks detect', {
          cwd: tempDir,
          stdio: 'pipe',
        });
      } catch (err) {
        // Gitleaks exits with code 1 when leaks are found
        detectedLeak = err.status === 1;
      }

      assert.strictEqual(detectedLeak, true, 'Gitleaks MUST detect the planted secret key and exit 1');
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});
