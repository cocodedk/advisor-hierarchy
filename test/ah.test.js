const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'ah.js');

function run(args, tmpDir) {
  return execSync(`node "${CLI}" ${args}`, {
    env: { ...process.env, CLAUDE_CONFIG_DIR: tmpDir },
    encoding: 'utf8'
  });
}

test('install copies skill files and command file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-test-'));
  try {
    const output = run('', tmpDir);
    assert.ok(output.includes('installed'));
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'advisor-hierarchy', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'advisor-hierarchy', 'executor.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'advisor-hierarchy', 'advisor.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'commands', 'ah.md')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('install is idempotent — running twice does not error', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-test-'));
  try {
    run('', tmpDir);
    run('', tmpDir);
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'advisor-hierarchy', 'SKILL.md')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('uninstall removes skill directory and command file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-test-'));
  try {
    run('', tmpDir);
    const output = run('uninstall', tmpDir);
    assert.ok(output.includes('uninstalled'));
    assert.ok(!fs.existsSync(path.join(tmpDir, 'skills', 'advisor-hierarchy')));
    assert.ok(!fs.existsSync(path.join(tmpDir, 'commands', 'ah.md')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('uninstall is idempotent — running when not installed does not error', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-test-'));
  try {
    run('uninstall', tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('unknown command prints usage and exits with error', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-test-'));
  try {
    let threw = false;
    let stderr = '';
    try {
      execSync(`node "${CLI}" foobar`, {
        env: { ...process.env, CLAUDE_CONFIG_DIR: tmpDir },
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (err) {
      threw = true;
      stderr = err.stderr || '';
    }
    assert.ok(threw, 'expected non-zero exit for unknown command');
    assert.ok(stderr.includes('Unknown command'), `expected "Unknown command" in stderr, got: ${stderr}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
