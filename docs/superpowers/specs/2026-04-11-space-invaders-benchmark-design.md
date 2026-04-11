# Space Invaders Benchmark Design

**Date:** 2026-04-11
**Purpose:** Compare /ah hierarchy vs direct single-pass build quality using an identical spec.

---

## Isolation Protocol

Both builds receive **only this document** as their specification. The /ah build is created first.
The direct build is then created by a **fresh agent with no access to /ah build files or session context**.
Cross-contamination invalidates the benchmark.

---

## Stack

React 18 + htm via CDN — no build step, same pattern used throughout this repo:

```html
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/htm@3/dist/htm.umd.js"></script>
```

```js
const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useCallback, useReducer } = React;
```

**Architecture pattern for canvas + React:**
- `useRef` on the `<canvas>` element for drawing
- Game state lives in `useRef` (mutable, no re-render per frame) — one `gameRef` object holding all mutable simulation state (aliens, bullets, shields, etc.)
- UI state (`score`, `lives`, `phase`, `level`) in `useState` — synced from `gameRef` after each frame
- Game loop runs inside `useEffect` via `requestAnimationFrame`; returns cleanup `cancelAnimationFrame`
- React renders HUD and overlay screens (start / game-over / level-clear) as JSX on top of the canvas
- Canvas positioned with CSS `position: absolute`; overlays positioned on top

---

## Game Spec

### Canvas & Layout

- Canvas: 800 × 600 px, centered in a full-viewport container
- Background: deep space — radial gradient (black center → dark navy edges) + vignette
- Parallax starfield: 3 layers (150 / 80 / 40 stars) scroll speeds 0.8 / 0.4 / 0.2 px/frame, drawn on canvas
- HUD: React JSX overlay at top — SCORE | HI-SCORE | LEVEL | LIVES (ship-icon × n); Orbitron font
- Font: `Orbitron` (Google Fonts) or `'Courier New', monospace` fallback

### Alien Grid

- 5 rows × 11 columns = 55 aliens at start
- 3 alien types by row: Type A = row 1 (top, 30 pts), Type B = rows 2–3 (20 pts), Type C = rows 4–5 (10 pts)
- Each type: 2 animation frames drawn with canvas 2D primitives (no images); frame toggles every 500 ms
- Grid moves as a unit; when outermost live alien hits canvas edge → drop 24 px, reverse direction
- Speed: `base × (1 + (55 − remaining) / 55 × 2)` px/frame
- Aliens reaching player row (y ≥ playerY − 32) → instant game over

### Player

- y = canvasH − 56 px; starts at canvas centre
- Arrow keys / A–D: move left/right at 240 px/s
- Spacebar: fire — **max 1 player bullet** on screen
- 3 lives; on hit: 0.5 s canvas shake + particle explosion + 1.5 s invincibility (blink every 150 ms)

### Alien Fire

- Every 1.2 s (→ 0.6 s at level 5+): pick random column, fire from lowest alive alien in that column
- Max **3 alien bullets** simultaneously
- Alien bullet shape visually distinct from player bullet (e.g. forked / zigzag)

### Shields / Bunkers

- 4 bunkers at y = canvasH − 140 px, evenly spaced
- Each: 6 × 4 grid of 6 × 6 px blocks
- Block states: 0 = solid bright-green, 1 = cracked dim-green, 2 = rubble dark-green, 3 = gone
- Both bullet types erode one state per hit

### Mystery Ship (UFO)

- Spawns at random edge every 15–25 s, crosses at y = 80 px, speed 120 px/s
- Score on hit: random from [50, 100, 150, 300]; show score text briefly at hit location
- Visual: saucer/oval shape + flickering red glow (`shadowBlur` pulse)

### Scoring & Hi-Score

| Event | Points |
|---|---|
| Type A alien | 30 |
| Type B alien | 20 |
| Type C alien | 10 |
| Mystery ship | 50 / 100 / 150 / 300 (random) |

Hi-score: `localStorage` key `si_hiscore`.

### Level Progression

- All aliens cleared → `LEVEL CLEAR` React overlay (1.5 s) → next wave
- Next wave: aliens reset; base speed ×1.15; fire interval ×0.9
- No upper cap

### Win / Lose

- Lose: lives = 0 OR alien reaches player row
- Win per wave: LEVEL CLEAR overlay → continue

---

## Visual Requirements

| Requirement | Notes |
|---|---|
| Space atmosphere | Gradient background + parallax starfield on canvas |
| Animated pixel-art aliens | 3 shapes × 2 frames, drawn with canvas primitives |
| Neon glow: player + player bullet | `ctx.shadowBlur` / `ctx.shadowColor` |
| Alien bullets visually distinct | Different shape + colour |
| Particle explosion on alien death | 8–12 particles, fade + scatter over ~400 ms |
| Shield erosion visible | 3 distinct colour states per block |
| Screen shake on player death | Translate canvas ±4 px for ~500 ms |
| UFO strobe effect | Flickering glow / opacity pulse |
| Styled React HUD | Orbitron font, icon lives, hi-score |
| Start screen | React overlay with animated title; aliens visibly marching on canvas behind it |
| Game over / level clear | Styled React overlays with score + replay/continue button |

---

## Feature Checklist (13 points, 1 each)

1. 5 × 11 alien grid, 3 distinct types rendered
2. Alien grid: horizontal sweep + drops on edge
3. Alien speed scales with remaining count
4. Player fires (max 1 bullet)
5. Alien fires (lowest in column, max 3 bullets)
6. Collision: player bullet ↔ aliens + shields; alien bullet ↔ player + shields
7. Shields (4 bunkers), 3 erosion states per block
8. Mystery ship with random score display
9. Lives: 3 lives, HUD icons, invincibility flash
10. Score + hi-score (localStorage)
11. Start screen
12. Game over (lose) + level clear (win per wave) screens
13. Level progression: speed + fire rate increase

---

## Code Structure (each file ≤ 200 lines)

| File | Responsibility |
|---|---|
| `space-invaders.html` | Canvas + root div, CDN scripts, font link, minimal CSS |
| `si-config.js` | CONFIG object: canvas size, speeds, scoring, alien shapes (pixel data arrays) |
| `si-engine.js` | Pure functions: initState, updateFrame, collision, spawnUFO — no React, no canvas |
| `si-render.js` | All canvas draw calls (drawAliens, drawPlayer, drawBullets, drawShields, drawStars, etc.) |
| `si-app.js` | React App: canvas ref, gameRef, game loop in useEffect, HUD + overlays as JSX |

---

## Scoring Rubric

| Dimension | Max |
|---|---|
| Visual quality | 5 |
| Code quality | 5 |
| Feature completeness | 13 |
| **Total** | **23** |

**Visual (1–5):** 5 = full atmosphere + all effects + memorable; 4 = good, 1–2 effects rough; 3 = functional; 2 = minimal; 1 = bare

**Code (1–5):** 5 = clean React/canvas split, pure engine functions, no magic numbers, edge cases; 4 = good; 3 = fragile; 2 = spaghetti; 1 = barely works

---

## Output Files

| File | Purpose |
|---|---|
| `docs/benchmark/ah/space-invaders.html` | /ah build entry point |
| `docs/benchmark/ah/si-*.js` | /ah build modules |
| `docs/benchmark/direct/space-invaders.html` | Direct build entry point |
| `docs/benchmark/direct/si-*.js` | Direct build modules |
| `benchmark/results-space-invaders.md` | Scored comparison |
| `benchmark/ah/notes-space-invaders.md` | /ah run metadata |
