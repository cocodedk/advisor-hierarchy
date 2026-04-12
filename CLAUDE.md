# CLAUDE.md — advisor-hierarchy

## Project Overview

A Claude Code skill installer. The npm package (`npx ah`) copies three Markdown skill files from `skills/advisor-hierarchy/` into `~/.claude/skills/advisor-hierarchy/` and registers a `/ah` command at `~/.claude/commands/ah.md`. There is no build step, no runtime library, no compilation. **The three skill files are the product.**

- **Language / Runtime**: Node.js 20 (CommonJS)
- **Framework**: N/A — pure Node.js CLI installer
- **Architecture**: Skill files + npm installer + GitHub Pages docs site
- **Package**: `ah` on npm

---

## Required Skills — ALWAYS Invoke These

These skills **must** be invoked when the relevant situation arises. Never skip them.

| Situation | Skill |
|-----------|-------|
| Before any new feature or screen | `superpowers:brainstorming` |
| Planning multi-step changes | `superpowers:writing-plans` |
| Writing or fixing core logic | `superpowers:test-driven-development` |
| First sign of a bug or failure | `superpowers:systematic-debugging` |
| Before completing a feature branch | `superpowers:requesting-code-review` |
| Before claiming any task done | `superpowers:verification-before-completion` |
| Working on UI / frontend | `frontend-design:frontend-design` |
| After implementing — reviewing quality | `simplify` |

---

## Architecture

```
advisor-hierarchy/
├── skills/advisor-hierarchy/  <- The skill (source of truth)
│   ├── SKILL.md               <- Master: decomposes, classifies, dispatches executors
│   ├── executor.md            <- Executor: does the work, calls advisor ≤3×
│   └── advisor.md             <- Advisor: Opus only, advice-only, ≤150 words
├── bin/ah.js                  <- CLI installer
├── test/                      <- Node.js test runner tests
├── docs/index.html            <- GitHub Pages site (single-file)
└── CLAUDE.md                  <- This file
```

### Layer Rules
- Master never executes — it decomposes and delegates only
- Executor consults advisor at exactly 3 moments: before non-trivial architectural decisions, when stuck, and before reporting DONE if >3 tool calls
- Advisor is advice-only: no tools, no user-facing output, imperative tone, ≤150 words
- All benchmark game files and their test files must be under 200 lines each

---

## Coding Conventions

- [ ] All models are **immutable** — use `copy()` / spread for mutations
- [ ] Functions are **pure** where possible — no hidden side effects
- [ ] State is a single source of truth per feature
- [ ] No hardcoded strings — use constants, config, or i18n resources
- [ ] CommonJS modules throughout

---

## Engineering Principles

### File Size
- **200-line maximum per file** — extract a class, function, or module when approaching the limit

### DRY · SOLID · KISS · YAGNI
- Extract shared logic into named utilities; never copy-paste
- Single Responsibility: one class/function does one thing
- Don't add features not yet needed
- Delete dead code immediately

### TDD
- Write the failing test first, make it pass, then refactor
- Test names describe behaviour: `"should reject duplicate email"`
- One assertion per test — keep tests focused and readable

### Commit hygiene
- Follow Conventional Commits: `feat: ...` / `fix: ...` / `chore: ...`
- The `commit-msg` hook enforces this automatically

---

## Build Commands

```bash
npm test                    # Run unit tests
node bin/ah.js              # Install skill locally
node bin/ah.js uninstall    # Uninstall skill
./scripts/install-hooks.sh  # Install git pre-commit hook
```

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — project conventions and session startup |
| `version.txt` | Semantic version (MAJOR.MINOR.PATCH) |
| `skills/advisor-hierarchy/SKILL.md` | Master tier skill definition |
| `skills/advisor-hierarchy/executor.md` | Executor tier skill definition |
| `skills/advisor-hierarchy/advisor.md` | Advisor tier skill definition |
| `.github/workflows/` | CI, release, and Pages automation |
| `.githooks/` | Pre-commit and commit-msg hooks |
| `scripts/install-hooks.sh` | One-time hook installer |

---

## docs/index.html Design System

Changes to the GitHub Pages site must match the existing aesthetic precisely:

```css
--bg: #09090f       /* near-black background */
--green: #00ff88    /* primary accent */
--amber: #ffb800    /* warning / cost callouts */
--blue: #4da6ff     /* secondary */
--dim: #3a3a52      /* borders, subdued elements */
--mid: #8888aa      /* secondary text */
```

---

## Starting a New Session

1. Read this file
2. Run `npm test` to confirm everything passes
3. Invoke `superpowers:brainstorming` before touching any feature
4. Follow the Required Skills table — every skill is mandatory, not optional
