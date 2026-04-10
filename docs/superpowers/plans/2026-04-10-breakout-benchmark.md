# Breakout Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the same Breakout game twice — once directly (no hierarchy) and once via /ah — then score both outputs on visual quality, code quality, and feature completeness.

**Architecture:** Two self-contained single-file HTML5 canvas games built from the same spec. Run 1 is built by the current session with no subagents. Run 2 is built by the /ah 3-tier hierarchy. Results compared in a scored Markdown report.

**Tech Stack:** HTML5 Canvas, vanilla JavaScript, no dependencies. Node.js built-in `node:test` for structure validation.

---

## File Map

| File | Role |
|---|---|
| `benchmark/direct/breakout.html` | Run 1: direct build |
| `benchmark/ah/breakout.html` | Run 2: /ah hierarchy build |
| `benchmark/results.md` | Scored comparison report |

---

### Task 1: Set up benchmark directory

**Files:**
- Create: `benchmark/direct/.gitkeep`
- Create: `benchmark/ah/.gitkeep`

- [ ] **Step 1: Create the directories and placeholder files**

```bash
mkdir -p /home/cocodedk/0-projects/advisor-hierarchy/benchmark/direct
mkdir -p /home/cocodedk/0-projects/advisor-hierarchy/benchmark/ah
touch /home/cocodedk/0-projects/advisor-hierarchy/benchmark/direct/.gitkeep
touch /home/cocodedk/0-projects/advisor-hierarchy/benchmark/ah/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
cd /home/cocodedk/0-projects/advisor-hierarchy
git add benchmark/
git commit -m "chore: add benchmark directory structure"
```

---

### Task 2: Direct build — `benchmark/direct/breakout.html`

Build the complete Breakout game in a single file, no subagents, no /ah. This is Run 1.

**Files:**
- Create: `benchmark/direct/breakout.html`

- [ ] **Step 1: Write `benchmark/direct/breakout.html`**

The file must be a single self-contained HTML file with this architecture:

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Breakout</title>
  <style>
    /* body: margin 0, dark bg (#0a0a1a), flex center, full-height */
    /* canvas: display block */
    /* score/lives HUD: positioned above canvas or overlaid */
  </style>
</head>
<body>
  <canvas id="game" width="600" height="500"></canvas>
  <script>
    // ── Constants ────────────────────────────────────────────
    const CANVAS_W = 600, CANVAS_H = 500;
    const BRICK_COLS = 10, BRICK_ROWS_COUNT = 6;
    const BRICK_W = 52, BRICK_H = 18, BRICK_PAD = 6;
    const BRICK_OFFSET_X = 17, BRICK_OFFSET_Y = 50;
    const BALL_RADIUS = 7;
    const PADDLE_W = 90, PADDLE_H = 12;
    const BALL_BASE_SPEED = 4.5;
    const SPEED_INCREMENT = 0.3;   // added every 5 bricks hit
    const TRAIL_LENGTH = 8;
    const PARTICLE_COUNT = 12;

    const BRICK_COLORS = [
      { fill: '#ef4444', glow: '#ff6b6b' },  // row 0 — red
      { fill: '#f97316', glow: '#fb923c' },  // row 1 — orange
      { fill: '#eab308', glow: '#fbbf24' },  // row 2 — yellow
      { fill: '#22c55e', glow: '#4ade80' },  // row 3 — green
      { fill: '#3b82f6', glow: '#60a5fa' },  // row 4 — blue
      { fill: '#8b5cf6', glow: '#a78bfa' },  // row 5 — violet
    ];

    // ── State ────────────────────────────────────────────────
    // phase: 'start' | 'playing' | 'dead' | 'gameover' | 'win'
    const state = {
      phase: 'start',
      lives: 3,
      score: 0,
      bricksHit: 0,
      ball: { x: 300, y: 350, vx: 0, vy: 0, speed: BALL_BASE_SPEED, trail: [] },
      paddle: { x: 255, y: 460, w: PADDLE_W, h: PADDLE_H },
      bricks: [],      // { x, y, w, h, color, glow, alive }
      particles: [],   // { x, y, vx, vy, life, maxLife, color }
    };

    // ── Functions to implement ───────────────────────────────
    // initBricks()          — fill state.bricks from BRICK_COLORS × BRICK_COLS
    // launchBall()          — set ball vx/vy at 45° angle, set phase='playing'
    // updateBall()          — move ball, push to trail (cap at TRAIL_LENGTH), detect wall/ceiling bounce
    // updatePaddle(mouseX)  — clamp paddle.x to canvas bounds
    // checkBallPaddle()     — bounce ball off paddle (reflect vy, add slight x influence from hit position)
    // checkBallBricks()     — AABB collision; on hit: brick.alive=false, score+=10, bricksHit++,
    //                         spawnParticles(), check speed-up (every 5 bricksHit add SPEED_INCREMENT)
    //                         check win (all bricks dead)
    // checkBallFloor()      — if ball.y > CANVAS_H: lose a life, reset ball to center above paddle,
    //                         set phase='dead' briefly then 'playing', or 'gameover' if lives===0
    // spawnParticles(x,y,color) — push PARTICLE_COUNT particles with random vx/vy, life=40
    // updateParticles()     — move particles, reduce life, filter dead ones
    // drawBall()            — draw trail (fading alpha circles), then glowing ball
    //                         (shadowBlur=15, shadowColor=ball glow white)
    // drawPaddle()          — linear gradient left→right (#818cf8 → #c084fc), rounded rect,
    //                         glow under paddle (shadowBlur=20, shadowColor=#818cf8)
    // drawBricks()          — for each alive brick: shadowBlur=10, shadowColor=brick.glow,
    //                         fillRect with brick.fill, 3px rounded corners
    // drawParticles()       — small circles, alpha fades with life ratio
    // drawHUD()             — score top-left, lives top-right (filled circles as hearts/dots)
    // drawScreen()          — overlay for 'start', 'dead', 'gameover', 'win' phases
    //                         start: "BREAKOUT" title + "Click to start"
    //                         dead: brief flash, auto-resume
    //                         gameover: "GAME OVER" + score + "Click to restart"
    //                         win: "YOU WIN!" + score + "Click to play again"
    // gameLoop()            — requestAnimationFrame loop:
    //                         clear canvas, update state, draw everything

    // ── Init ─────────────────────────────────────────────────
    // canvas.addEventListener('mousemove', ...)
    // canvas.addEventListener('click', ...)   — start / restart
    // document.addEventListener('keydown', ...) — arrow keys move paddle
    // initBricks();
    // requestAnimationFrame(gameLoop);
  </script>
</body>
</html>
```

Implement every function listed above. No placeholder comments in the final file — all functions must be fully coded. The game must be playable end-to-end.

- [ ] **Step 2: Open in browser and verify it plays**

```bash
xdg-open /home/cocodedk/0-projects/advisor-hierarchy/benchmark/direct/breakout.html
# or: open benchmark/direct/breakout.html
```

Verify:
- Start screen appears
- Click starts the game
- Ball launches, bounces off walls/ceiling
- Paddle follows mouse
- Bricks break with particle effect
- Lives decrease when ball falls
- Game-over screen appears after 3 lives lost
- Win screen appears when all bricks cleared

- [ ] **Step 3: Commit**

```bash
cd /home/cocodedk/0-projects/advisor-hierarchy
git add benchmark/direct/breakout.html
git commit -m "feat: add direct Breakout build (Run 1 — no hierarchy)"
```

---

### Task 3: /ah hierarchy build — `benchmark/ah/breakout.html`

Invoke /ah with the exact shared spec. This is Run 2.

**Files:**
- Create: `benchmark/ah/breakout.html` (produced by the hierarchy)

- [ ] **Step 1: Invoke /ah with the exact shared spec**

Type this in Claude Code (or use the Skill tool to invoke `advisor-hierarchy`):

> Build a Breakout game as a single self-contained `breakout.html` file, saved to `benchmark/ah/breakout.html` in the current project.
>
> **Gameplay:** Ball bounces off walls and paddle, destroys bricks on contact. Player controls paddle with mouse (or arrow keys). 3 lives, score counter. Start screen, game-over screen, win screen.
>
> **Graphics:** Dark background, neon/glow aesthetic. Bricks in 6 color rows (red → violet). Ball has a trailing glow. Paddle has a gradient. Smooth 60fps canvas animation.
>
> **Polish:** Brick shatter effect when destroyed. Ball speeds up slightly every 5 bricks. Score shown live. Level resets on life loss.

- [ ] **Step 2: Record what the hierarchy produced**

After /ah completes, note:
- How many subtasks were created
- Which model handled each subtask (Haiku/Sonnet)
- Whether any Opus advisor calls were made
- Approximate token count (from agent metadata if available)

Add these notes to `benchmark/ah/notes.md`:

```markdown
# /ah Run Notes

## Task decomposition
- Subtask 1: [description] — [model]
- Subtask 2: [description] — [model]
...

## Advisor consultations
- [none / description of each call]

## Token metadata
- Total tokens: [from agent output if available]
```

- [ ] **Step 3: Open in browser and verify it plays**

```bash
xdg-open /home/cocodedk/0-projects/advisor-hierarchy/benchmark/ah/breakout.html
```

Play through enough to verify the game is functional.

- [ ] **Step 4: Commit**

```bash
cd /home/cocodedk/0-projects/advisor-hierarchy
git add benchmark/ah/
git commit -m "feat: add /ah Breakout build (Run 2 — hierarchy)"
```

---

### Task 4: Evaluate and write results

Score both outputs against the spec and write the comparison report.

**Files:**
- Create: `benchmark/results.md`

- [ ] **Step 1: Score Run 1 (direct)**

Open `benchmark/direct/breakout.html` in browser. Score each dimension:

**Visual quality (1–5):**
- 1 — Functional but plain, no glow/effects
- 2 — Basic colors, minimal animation
- 3 — Glow present, animation works, some polish
- 4 — Strong neon aesthetic, smooth trail, good particle FX
- 5 — Exceptional — every visual detail lands, feels professional

**Code quality (1–5):**
- 1 — Long monolithic functions, magic numbers, no structure
- 2 — Some structure, messy state management
- 3 — Clear functions, named constants, readable
- 4 — Well-decomposed, good naming, easy to follow logic
- 5 — Clean separation of concerns, self-documenting

**Feature completeness (0–11):** Check each item:
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

- [ ] **Step 2: Score Run 2 (/ah)**

Repeat the same scoring for `benchmark/ah/breakout.html`.

- [ ] **Step 3: Write `benchmark/results.md`**

```markdown
# Breakout Benchmark Results

**Date:** 2026-04-10
**Spec:** Both runs built from identical shared spec (see docs/superpowers/specs/2026-04-10-breakout-benchmark-design.md)

---

## Run 1: Direct (no /ah)

| Dimension | Score |
|---|---|
| Visual quality | X/5 |
| Code quality | X/5 |
| Feature completeness | X/11 |
| **Total** | **X/21** |

**Feature checklist:**
- [x/✗] Ball bounces off walls and ceiling
- [x/✗] Ball bounces off paddle
- [x/✗] Paddle controlled by mouse or arrow keys
- [x/✗] Bricks destroyed on contact
- [x/✗] 3 lives with reset on life loss
- [x/✗] Live score counter
- [x/✗] Start screen
- [x/✗] Game-over screen
- [x/✗] Win screen
- [x/✗] Brick shatter/break effect
- [x/✗] Ball speeds up every 5 bricks

**Notes:** [observations on approach, quality, what stood out]

---

## Run 2: /ah hierarchy

| Dimension | Score |
|---|---|
| Visual quality | X/5 |
| Code quality | X/5 |
| Feature completeness | X/11 |
| **Total** | **X/21** |

**Feature checklist:**
- [x/✗] Ball bounces off walls and ceiling
- [x/✗] Ball bounces off paddle
- [x/✗] Paddle controlled by mouse or arrow keys
- [x/✗] Bricks destroyed on contact
- [x/✗] 3 lives with reset on life loss
- [x/✗] Live score counter
- [x/✗] Start screen
- [x/✗] Game-over screen
- [x/✗] Win screen
- [x/✗] Brick shatter/break effect
- [x/✗] Ball speeds up every 5 bricks

**Hierarchy notes:**
- Subtasks: [N]
- Models used: [Haiku/Sonnet breakdown]
- Advisor calls: [N]
- Tokens (if available): [N]

**Notes:** [observations on decomposition, what the hierarchy did differently]

---

## Side-by-Side Comparison

| Dimension | Direct | /ah | Winner |
|---|---|---|---|
| Visual quality | X/5 | X/5 | [direct / /ah / tie] |
| Code quality | X/5 | X/5 | [direct / /ah / tie] |
| Feature completeness | X/11 | X/11 | [direct / /ah / tie] |
| **Total** | **X/21** | **X/21** | **[direct / /ah / tie]** |

## Verdict

[2-3 sentence honest assessment: what /ah did better, what it did worse, whether the overhead was justified]
```

- [ ] **Step 4: Commit**

```bash
cd /home/cocodedk/0-projects/advisor-hierarchy
git add benchmark/results.md
git commit -m "docs: add Breakout benchmark results"
```
