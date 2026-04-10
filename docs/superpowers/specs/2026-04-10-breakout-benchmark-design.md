# Breakout Benchmark Design Spec

**Date:** 2026-04-10
**Status:** Approved

---

## Goal

Benchmark `/ah` (advisor-hierarchy) vs direct Claude Code by building the same Breakout game twice — once without the hierarchy, once with it — then scoring both outputs on three equal dimensions.

---

## The Shared Spec

Both runs receive this exact task description, nothing more:

> Build a Breakout game as a single self-contained `breakout.html` file.
>
> **Gameplay:** Ball bounces off walls and paddle, destroys bricks on contact. Player controls paddle with mouse (or arrow keys). 3 lives, score counter. Start screen, game-over screen, win screen.
>
> **Graphics:** Dark background, neon/glow aesthetic. Bricks in 6 color rows (red → violet). Ball has a trailing glow. Paddle has a gradient. Smooth 60fps canvas animation.
>
> **Polish:** Brick shatter effect when destroyed. Ball speeds up slightly every 5 bricks. Score shown live. Level resets on life loss.

---

## Execution Order

1. **Direct build** — Claude Code (Sonnet) builds `breakout.html` directly, no hierarchy, no subagents
2. **`/ah` build** — The 3-tier hierarchy (master → Haiku/Sonnet executors → Opus advisor) builds `breakout.html` from the same spec
3. **Evaluation** — Both outputs opened in browser, screenshotted, scored

---

## Scoring

| Dimension | What we measure | Scale |
|---|---|---|
| Visual quality | Aesthetics, glow/neon effects, animation smoothness, overall polish | 1–5 |
| Code quality | Structure, readability, variable naming, logic clarity | 1–5 |
| Feature completeness | Checklist: 11 items — ball physics, paddle control, lives, score, screens, shatter, speed-up | 0–11 |

**Feature completeness checklist:**
- [ ] Ball bounces off walls and ceiling
- [ ] Ball bounces off paddle
- [ ] Paddle controlled by mouse or arrow keys
- [ ] Bricks destroyed on contact
- [ ] 3 lives with reset on life loss
- [ ] Live score counter
- [ ] Start screen
- [ ] Game-over screen
- [ ] Win screen
- [ ] Brick shatter/break effect
- [ ] Ball speeds up every 5 bricks

*(11 items — scale adjusted to 0–11)*

---

## Output Structure

```
benchmark/
  direct/
    breakout.html       ← built by direct Claude Code
  ah/
    breakout.html       ← built by /ah hierarchy
  results.md            ← scored comparison report
```

---

## Comparison Report Format (`results.md`)

```markdown
# Breakout Benchmark Results

## Run 1: Direct (no /ah)
- Visual quality: X/5
- Code quality: X/5
- Feature completeness: X/11
- Notes: ...

## Run 2: /ah hierarchy
- Visual quality: X/5
- Code quality: X/5
- Feature completeness: X/11
- Notes: ...

## Verdict
...
```

---

## What This Tests

- Whether /ah produces better-structured code through forced decomposition
- Whether Opus advisor guidance improves visual polish decisions
- Whether the hierarchy overhead (more tokens, more round-trips) is justified by output quality
- Whether Haiku/Sonnet splitting produces meaningfully different results from a single Sonnet pass

---

## Out of Scope

- Performance benchmarking (frame rate, memory)
- Mobile responsiveness
- Multiplayer
- Sound effects
