# Contributing to advisor-hierarchy

Thank you for your interest in contributing. This project is maintained by [Babak Bandpey](https://www.linkedin.com/in/babakbandpey) at [cocode.dk](https://cocode.dk).

## What belongs here

Skills, rules, and documentation that improve the 3-tier agent hierarchy for general-purpose coding and writing tasks. Changes should benefit any Claude Code user regardless of their project domain.

## What does not belong here

- Project-specific rules or domain-specific skill variants
- Dependencies on third-party services
- Changes that auto-trigger the skill (it must remain explicitly invoked)

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b your-feature`
3. Make your changes
4. Test by running `npx ah` and invoking `/ah` on a real task
5. Open a pull request describing: what you changed, why, and how you tested it

## Testing skills

Skills are Markdown — there are no unit tests. Testing means:
1. Install with `npx ah`
2. Invoke `/ah "some task"` in Claude Code
3. Verify the master decomposes and delegates correctly
4. Verify executors consult Opus at appropriate moments
5. Verify Opus responses are advice-only (no tool calls, no user output)

## Running tests

```bash
node --test test/ah.test.js
```

## Reporting issues

Open a GitHub issue at https://github.com/cocodedk/advisor-hierarchy/issues with:
- What you expected to happen
- What actually happened
- The task you gave to `/ah`
