# `ah` npm Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `install.sh` with an `ah` npm package so anyone on Mac, Linux, or Windows can install the advisor-hierarchy skill with `npx ah`.

**Architecture:** A zero-dependency Node.js CLI (`bin/ah.js`) bundled in an npm package. It resolves the platform-correct Claude config dir at runtime, then copies skill files and the `/ah` command. A `CLAUDE_CONFIG_DIR` env var overrides the default path for testing. Integration tests use Node's built-in `node:test` runner with a temp directory so no real `~/.claude/` is touched.

**Tech Stack:** Node.js 18+ (built-in `fs`, `path`, `os`, `child_process`), `node:test` for integration tests, npm for publishing.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `package.json` | npm metadata, bin entry, test script |
| Create | `bin/ah.js` | CLI: install and uninstall logic |
| Create | `test/ah.test.js` | Integration tests (4 cases) |
| Delete | `install.sh` | Replaced by `npx ah` |
| Modify | `README.md` | Replace install instructions |
| Modify | `CONTRIBUTING.md` | Update dev workflow |

---

## Task 1: Create `package.json`

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "ah",
  "version": "1.0.0",
  "description": "Install the advisor-hierarchy skill for Claude Code",
  "bin": {
    "ah": "bin/ah.js"
  },
  "files": [
    "bin/",
    "skills/"
  ],
  "scripts": {
    "test": "node --test test/ah.test.js"
  },
  "keywords": ["claude-code", "claude", "skill", "advisor-hierarchy"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/cocodedk/advisor-hierarchy.git"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add package.json for npm publishing"
```

---

## Task 2: Write failing integration tests

**Files:**
- Create: `test/ah.test.js`

- [ ] **Step 1: Create `test/ah.test.js`**

```javascript
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
node --test test/ah.test.js
```

Expected: 4 failures — `Cannot find module '../bin/ah.js'` or similar.

- [ ] **Step 3: Commit failing tests**

```bash
git add test/ah.test.js
git commit -m "test: add integration tests for ah CLI"
```

---

## Task 3: Implement `bin/ah.js`

**Files:**
- Create: `bin/ah.js`

- [ ] **Step 1: Create `bin/` directory and write `bin/ah.js`**

```javascript
#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function getConfigDir() {
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA, 'Claude');
  }
  return path.join(os.homedir(), '.claude');
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function install() {
  const configDir = getConfigDir();
  const skillSrc = path.join(__dirname, '..', 'skills', 'advisor-hierarchy');
  const skillDest = path.join(configDir, 'skills', 'advisor-hierarchy');
  const cmdDest = path.join(configDir, 'commands', 'ah.md');

  copyDirSync(skillSrc, skillDest);

  fs.mkdirSync(path.dirname(cmdDest), { recursive: true });
  fs.writeFileSync(
    cmdDest,
    'Invoke the `advisor-hierarchy` skill to run a 3-tier agent hierarchy on the following task:\n\n$ARGUMENTS\n'
  );

  console.log('advisor-hierarchy installed. Run /ah in Claude Code to use it.');
}

function uninstall() {
  const configDir = getConfigDir();
  const skillDest = path.join(configDir, 'skills', 'advisor-hierarchy');
  const cmdDest = path.join(configDir, 'commands', 'ah.md');

  fs.rmSync(skillDest, { recursive: true, force: true });
  if (fs.existsSync(cmdDest)) fs.unlinkSync(cmdDest);

  console.log('advisor-hierarchy uninstalled.');
}

const command = process.argv[2];
if (command === 'uninstall') {
  uninstall();
} else {
  install();
}
```

- [ ] **Step 2: Make the file executable**

```bash
chmod +x bin/ah.js
```

- [ ] **Step 3: Run tests — verify all 4 pass**

```bash
node --test test/ah.test.js
```

Expected output:
```
✔ install copies skill files and command file (Xms)
✔ install is idempotent — running twice does not error (Xms)
✔ uninstall removes skill directory and command file (Xms)
✔ uninstall is idempotent — running when not installed does not error (Xms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

- [ ] **Step 4: Commit**

```bash
git add bin/ah.js
git commit -m "feat: add ah CLI — install and uninstall advisor-hierarchy skill"
```

---

## Task 4: Remove `install.sh`

**Files:**
- Delete: `install.sh`

- [ ] **Step 1: Delete `install.sh`**

```bash
git rm install.sh
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
node --test test/ah.test.js
```

Expected: 4 passing.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove install.sh — replaced by npx ah"
```

---

## Task 5: Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the Install section**

Find the `## Install` section. Replace it with:

```markdown
## Install

```bash
npx ah
```

That's it. Works on Mac, Linux, and Windows. Running it again updates to the latest version.

## Uninstall

```bash
npx ah uninstall
```
```

Remove the old `## Uninstall` section (if it exists separately) since it is now covered above.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update install instructions to use npx ah"
```

---

## Task 6: Update `CONTRIBUTING.md`

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Replace any references to `install.sh` or `bash install.sh`**

Find all occurrences of `install.sh` in `CONTRIBUTING.md`. Replace with `npx ah` (install) or `npx ah uninstall` (uninstall).

Also add a note about the test suite:

```markdown
## Running tests

```bash
node --test test/ah.test.js
```
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: update contributing guide for npm workflow"
```

---

## Self-Review Checklist

- [x] `package.json` with correct `bin`, `files`, and `test` fields
- [x] `bin/ah.js` handles install, update (idempotent), uninstall, cross-platform path, env var override
- [x] 4 integration tests covering install, idempotent install, uninstall, idempotent uninstall
- [x] `install.sh` removed
- [x] README and CONTRIBUTING updated
- [x] No TBDs or placeholders
- [x] Types/names consistent across all tasks
- [x] Windows path (`%APPDATA%\Claude`) handled in `getConfigDir()`
