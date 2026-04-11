# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Default Skills

Always use these skills when the task warrants them — do not wait to be asked:

- **`/ah`** — use for any non-trivial task (multi-file changes, design decisions, anything with architectural impact). This repo is the source of that skill; use it on itself.
- **`frontend-design:frontend-design`** — use for any change to `docs/index.html`. This site has a strong aesthetic; match it precisely.
- **`superpowers:brainstorming`** → **`superpowers:writing-plans`** → **`superpowers:executing-plans`** — use for anything that requires more than a one-liner change.

## What This Repo Is

A Claude Code skill installer. The npm package (`npx ah`) copies three Markdown skill files from `skills/advisor-hierarchy/` into `~/.claude/skills/advisor-hierarchy/` and registers a `/ah` command at `~/.claude/commands/ah.md`. There is no build step, no runtime library, no compilation.

## Commands

```bash
# Run tests
npm test                         # or: node --test test/ah.test.js

# Install git pre-commit hook (runs npm test before every commit)
./scripts/install-hooks.sh

# Install the skill locally (useful after editing skill files)
node bin/ah.js

# Uninstall the skill
node bin/ah.js uninstall
```

## Architecture

```
skills/advisor-hierarchy/   ← The skill (source of truth)
  SKILL.md                  ← Master: decomposes, classifies, dispatches executors
  executor.md               ← Executor: Haiku/Sonnet, does the work, calls Opus ≤3×
  advisor.md                ← Advisor: Opus only, advice-only, no tools, ≤150 words

bin/ah.js                   ← CLI installer: copies skills/ → ~/.claude/skills/, creates command file
test/ah.test.js             ← Tests install/uninstall/idempotency via node:test (CommonJS)
docs/index.html             ← GitHub Pages site (single-file, all CSS inline)
docs/benchmark/             ← Live Breakout game files served by GitHub Pages
```

**The three skill files are the product.** Everything else (npm package, tests, docs site) exists to distribute and explain them.

## Skill Design Rules

When editing skill files (`skills/advisor-hierarchy/*.md`):

- **Master never executes** — it decomposes and delegates only. If you catch master doing file writes or running commands, that's a bug.
- **Executor consults Opus advisor at exactly 3 moments:** before non-trivial architectural decisions, when stuck (same error 2+ times), and before reporting DONE if the task required >3 tool calls. Cap at 3 advisor calls total per task.
- **Advisor is advice-only** — no tools, no user-facing output, imperative tone, ≤150 words. It signals `STOP` if the task is fundamentally broken.
- **Executors report status:** `DONE` / `DONE_WITH_CONCERNS: [x]` / `NEEDS_CONTEXT: [x]` / `BLOCKED`
- **Model classification:** Haiku for mechanical/isolated changes (1-2 files, unambiguous spec); Sonnet for anything with judgment calls, multi-file impact, or integration concerns.

## docs/index.html Design System

Changes to the GitHub Pages site must match the existing aesthetic precisely:

```css
--bg: #09090f       /* near-black background */
--green: #00ff88    /* primary accent */
--amber: #ffb800    /* warning / cost callouts */
--blue: #4da6ff     /* secondary */
--dim: #3a3a52      /* borders, subdued elements */
--mid: #8888aa      /* secondary text */

/* Fonts */
Bebas Neue          /* display / headings */
JetBrains Mono      /* monospace / code / buttons */
```

Button pattern: `.btn` base + `.btn-primary` (green fill → ghost on hover) or `.btn-ghost` (dim border → green on hover).

## Benchmark File Rules

All benchmark game files and their test files **must not exceed 200 lines each**. This means:

- Games must be **modularized**: split into separate JS files (game logic, rendering, AI, state, etc.) rather than one monolithic HTML file
- If a framework makes the code easier to read, debug, and test, **prefer React** (via CDN — no build step) over vanilla JS for benchmark game files
- Test files must also be under 200 lines — split into multiple describe-level files if needed
- The 200-line limit is a hard constraint; refactor proactively when adding features

## GitHub Pages Deploy

Automatically deploys on push to `master` when files under `docs/**` change. Games in `benchmark/` at the repo root are **not** served — copies live at `docs/benchmark/` for GitHub Pages.

## Testing Skill Changes

Unit tests only cover the npm installer (`bin/ah.js`). Skill content (`.md` files) has no automated tests — validate by invoking `/ah` on a real task in Claude Code and checking that the hierarchy decomposes, delegates, and synthesizes correctly.
