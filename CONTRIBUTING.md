# Contributing to advisor-hierarchy

Thank you for your interest in contributing. This project is maintained by [Babak Bandpey](https://www.linkedin.com/in/babakbandpey) at [Cocode](https://cocode.dk).

## Local Setup
1. Install Node.js 20+.
2. Clone the repository.
3. Install dependencies: `npm install`
4. Install Git hooks (see below).

## Install Git Hooks
```sh
./scripts/install-hooks.sh
```

## Local Git Setup
Run these once after cloning:
```bash
git config pull.rebase true
git config core.autocrlf input
git config push.autoSetupRemote true
git config init.defaultBranch main
```

## Build and Test Commands
```bash
npm test           # Run unit tests
npm test -- --watch  # Watch mode
node bin/ah.js     # Install skill locally
node bin/ah.js uninstall  # Uninstall skill
```

## What Belongs Here

Changes to this repo fall into two categories:

1. **Skill content** — `skills/advisor-hierarchy/*.md` — the Markdown instructions that define the advisor-hierarchy behavior. No compilation or build step.
2. **Installer and tests** — `bin/ah.js`, `test/ah.test.js` — the npm package that distributes the skill.

## Skill Design Rules

- **Master never executes** — it decomposes and delegates only.
- **Executor consults advisor at most 3 times** per task.
- **Advisor is advice-only** — no tools, no user-facing output, ≤150 words.
- Keep all benchmark game files and their test files under 200 lines each.

## Coding Style
- CommonJS modules (the installer uses `require`)
- Keep files small and focused — 200-line maximum
- Follow Conventional Commits for all commit messages

## PR Checklist
- [ ] Tests pass (`npm test`)
- [ ] Manual test: install skill with `node bin/ah.js` and verify it works
- [ ] Skill changes validated by invoking `/ah` on a real task
- [ ] Updated docs if behavior changed

## Branch Naming Conventions

| Branch prefix | Conventional Commit type | Example |
|---|---|---|
| `feature/` | `feat:` | `feature/add-new-executor-tier` |
| `fix/` | `fix:` | `fix/install-path-on-windows` |
| `chore/` | `chore:` | `chore/update-dependencies` |
| `docs/` | `docs:` | `docs/update-skill-design-rules` |
| `refactor/` | `refactor:` | `refactor/extract-tier-logic` |
| `ci/` | `ci:` | `ci/add-dependabot` |

Branch names use **kebab-case**. Never commit directly to `master` — always open a PR.
