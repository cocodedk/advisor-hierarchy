# Design: `ah` npm package

**Date:** 2026-04-10
**Status:** Approved

## Problem

The advisor-hierarchy skill must be physically copied to `~/.claude/skills/` because Claude Code's skill scanner does not follow symlinks. The current `install.sh` is bash-only (breaks on Windows), has no update path, and no uninstall. This creates friction for contributors and end-users on all platforms.

## Solution

Publish an npm package named `ah` that provides a single cross-platform CLI for managing the skill installation.

## User-facing interface

```
npx ah             # install or update skill + /ah command
npx ah uninstall   # remove skill + /ah command
```

- No global install required (`npx` handles it)
- Idempotent: running `npx ah` twice is safe
- Works on Mac, Linux, Windows

## Package structure

```
package.json          # name: "ah", version, bin: { ah: "bin/ah.js" }
bin/ah.js             # CLI entrypoint (~60 lines, zero external deps)
skills/               # existing skill files (source of truth)
  advisor-hierarchy/
    SKILL.md
    executor.md
    advisor.md
```

## Platform paths

| Platform | Claude config dir |
|---|---|
| Mac / Linux | `~/.claude/` |
| Windows | `%APPDATA%\Claude\` |

Detected at runtime via `process.platform` and `process.env`.

## bin/ah.js behaviour

### `npx ah` (install / update)
1. Resolve Claude config dir for current platform
2. Copy `skills/advisor-hierarchy/` → `<config>/skills/advisor-hierarchy/` (overwrite)
3. Write `<config>/commands/ah.md` (overwrite)
4. Print: `advisor-hierarchy installed. Run /ah in Claude Code to use it.`

### `npx ah uninstall`
1. Resolve Claude config dir
2. Remove `<config>/skills/advisor-hierarchy/` (recursive)
3. Remove `<config>/commands/ah.md`
4. Print: `advisor-hierarchy uninstalled.`

## Error handling

- If Claude config dir cannot be resolved: print clear error with expected path, exit 1
- If a file operation fails: print the OS error message, exit 1
- No silent failures

## What is removed

- `install.sh` — replaced by `npx ah`
- References to `install.sh` updated in README and CONTRIBUTING

## Out of scope

- Version pinning / rollback
- Multiple skill management
- Auto-update on `git pull`
