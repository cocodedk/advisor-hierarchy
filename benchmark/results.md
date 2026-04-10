# Breakout Benchmark Results

**Date:** 2026-04-10
**Spec:** Both runs built from identical shared spec — see `docs/superpowers/specs/2026-04-10-breakout-benchmark-design.md`

---

## Run 1: Direct (no /ah)

Built in a single pass by the current session. No subagents, no decomposition.

| Dimension | Score |
|---|---|
| Visual quality | 4/5 |
| Code quality | 4/5 |
| Feature completeness | 11/11 |
| **Total** | **19/21** |

**Feature checklist:**
- [x] Ball bounces off walls and ceiling
- [x] Ball bounces off paddle
- [x] Paddle controlled by mouse and arrow keys
- [x] Bricks destroyed on contact
- [x] 3 lives with reset on life loss
- [x] Live score counter
- [x] Start screen
- [x] Game-over screen
- [x] Win screen
- [x] Brick shatter/break effect (particles with gravity)
- [x] Ball speeds up every 5 bricks (with velocity renormalization)

**Notes:**

Strong visual output on the first pass — neon glow bricks, glowing ball trail with inner highlight, left→right paddle gradient with highlight streak, glowing HUD life dots, neon title glow per screen, red death flash. All effects were present and correct.

Code is readable and well-organized. Two minor weaknesses: arrow key movement uses a separate `setInterval` outside the game loop (slightly fragile), and mouse position is not scaled for CSS-resized canvases (will break if canvas is shrunk with CSS). Uses `e.key` for keyboard events, which is keyboard-layout-dependent. These are all minor for a game file, but noticeable in review.

---

## Run 2: /ah hierarchy

Built in two sequential passes by the 3-tier hierarchy.

| Dimension | Score |
|---|---|
| Visual quality | 4/5 |
| Code quality | 5/5 |
| Feature completeness | 11/11 |
| **Total** | **20/21** |

**Feature checklist:**
- [x] Ball bounces off walls and ceiling
- [x] Ball bounces off paddle (angle calculated via maxAngle formula)
- [x] Paddle controlled by mouse and arrow keys
- [x] Bricks destroyed on contact
- [x] 3 lives with reset on life loss
- [x] Live score counter
- [x] Start screen
- [x] Game-over screen
- [x] Win screen
- [x] Brick shatter/break effect (particles with gravity)
- [x] Ball speeds up every 5 bricks (velocity renormalized every brick hit)

**Hierarchy notes:**
- Subtasks: 2 (sequential)
- Models used: Sonnet × 2 (Task 1: core game; Task 2: visual polish)
- Advisor calls: 0 (neither executor needed strategic guidance)
- Tokens: ~59,460 total (Task 1: 26,672 / Task 2: 32,788)

**Notes:**

Task 1 (Sonnet) focused entirely on getting the architecture right. This produced measurably better code: `createState()` factory function for clean restarts; proper mouse-position scaling (`scaleX`) that handles CSS-resized canvases; `e.code` instead of `e.key` (keyboard-layout-agnostic); velocity normalized every brick hit, not just on speed-up; real-time `keys` object integrated into the game loop instead of a separate `setInterval`.

Task 2 (Sonnet) added the visual polish layer: neon title glow, red death flash, left→right paddle gradient, styled HUD, brighter grid, blue-tinted ball trail, cleaned-up start screen. Visual quality reached parity with the direct build.

One aesthetic difference: the ball trail is blue-tinted (`rgba(200, 220, 255, ...)`) rather than pure white — a distinct stylistic choice from the hierarchy's executor.

---

## Side-by-Side Comparison

| Dimension | Direct | /ah | Winner |
|---|---|---|---|
| Visual quality | 4/5 | 4/5 | Tie |
| Code quality | 4/5 | 5/5 | /ah |
| Feature completeness | 11/11 | 11/11 | Tie |
| **Total** | **19/21** | **20/21** | **/ah** |

---

## Verdict

The `/ah` hierarchy produced the same visual output and feature completeness as the direct build, but with measurably cleaner code — factory state pattern, proper mouse scaling, keyboard-layout-agnostic input, and tighter physics normalization. The code quality difference is attributable to the hierarchy's forced decomposition: the first executor focused entirely on architecture (no pressure to also handle visuals), which freed it to make better technical decisions.

The overhead is real: the hierarchy used ~59,460 tokens across two agent round-trips vs. a single direct pass. No Opus advisor calls were needed, so the advisor tier added no value here — the tasks were well-specified enough that both executors executed without escalation.

**When /ah justifies its overhead:** Tasks where code architecture matters (multi-file, long-lived code, needs to be maintained). The decomposition forces separation of concerns that a single-pass build tends to skip under pressure to get everything done at once.

**When it doesn't:** Throwaway scripts, visuals-only work, or tightly-scoped tasks where the spec is already precise. A single well-prompted Sonnet pass would produce equivalent results with less overhead.
