# Battleship Benchmark Results

**Date:** 2026-04-11
**Spec:** Both runs built from identical shared spec — see `docs/superpowers/specs/2026-04-11-battleship-benchmark-design.md`
**Branch:** `feat/dynamic-model-selection` (tests the updated /ah skill with dynamic model tier discovery)

---

## Run 1: Direct (no /ah)

Built in a single pass. No subagents, no decomposition.

| Dimension | Score |
|---|---|
| Visual quality | 4/5 |
| Code quality | 4/5 |
| Feature completeness | 12/12 |
| **Total** | **20/22** |

**Feature checklist:**
- [x] Two 10×10 grids rendered correctly
- [x] Manual ship placement (click + orientation toggle)
- [x] Random placement button
- [x] Player can fire at computer grid
- [x] Computer fires randomly, no repeat shots
- [x] Hit / miss distinction (visual markers)
- [x] Sunk ship fully revealed on board
- [x] Turn indicator
- [x] Start screen
- [x] Win screen
- [x] Lose screen
- [x] Ship status HUD

**Notes:**

Strong single-pass output. Neon blue title pulse, hit ripple animation, hover crosshair on attack grid, styled start/win/lose screens, ship count HUD. All 12 features present.

Two IMPORTANT code quality issues caught and fixed post-review: computer fire used a `do/while` retry loop with 200-attempt cap (replaced with available-cells list), and `e.key` was used for rotation shortcut (replaced with `e.code`). This mirrors the same weaknesses found in the Breakout direct build.

Remaining weaknesses: `canPlaceShip` handles both `boolean` and `string` grid schemas via duck-typing (fragile dual-mode logic); state reset is via explicit variable mutation in `startGame()` rather than a factory pattern; `updateHUD` computes computer ships via a separate counter rather than from the ships array (asymmetric). All minor but noticeable in review.

Font: `'Segoe UI', system-ui` — generic, no typographic identity. Single `--ship-color` for all ship types (no per-type distinction).

---

## Run 2: /ah hierarchy

Built in two sequential passes by the 3-tier hierarchy (dynamic model selection active).

| Dimension | Score |
|---|---|
| Visual quality | 5/5 |
| Code quality | 5/5 |
| Feature completeness | 12/12 |
| **Total** | **22/22** |

**Feature checklist:**
- [x] Two 10×10 grids rendered correctly
- [x] Manual ship placement (click + orientation toggle)
- [x] Random placement button
- [x] Player can fire at computer grid
- [x] Computer fires randomly, no repeat shots (available-cells list from the start)
- [x] Hit / miss distinction (visual markers)
- [x] Sunk ship fully revealed on board
- [x] Turn indicator (green/amber animated glow)
- [x] Start screen
- [x] Win screen
- [x] Lose screen
- [x] Ship status HUD (per-ship dot indicators + skull glyph on sunk)

**Hierarchy notes:**
- Model discovery (Step 0): `FAST=haiku, CAPABLE=sonnet, APEX=opus`
- Subtasks: 2 (sequential)
- Models used: CAPABLE (sonnet) × 2 — Task 1: core mechanics; Task 2: visual polish
- Advisor calls: 0 (neither executor needed strategic guidance)
- Tokens: ~67,311 total (Subtask 1: ~24,991 / Subtask 2: ~42,320)

**Notes:**

Subtask 1 (CAPABLE/Sonnet) focused entirely on architecture: `createState()` factory for clean restarts, available-cells list for computer fire from the start (not after review), event delegation via `closest('.cell')` (robust against child elements like injected ripple spans), ripple cleanup via `animationend` with `{ once: true }` (no leaks), phase + turn gating at both event handler level and function level.

Subtask 2 (CAPABLE/Sonnet) added a distinctive visual layer: **Orbitron** font throughout, atmospheric dark background with radial gradient + grid texture overlay, five per-type ship colors via `data-ship` attributes (Carrier: steel blue, Battleship: teal, Cruiser: amber/olive, Submarine: indigo, Destroyer: bronze), animated turn indicator (green glow for player, amber for computer), per-ship HUD with dot indicators + skull glyph (`☠`) on sunk ships.

Three IMPORTANT code quality issues caught post-review: dead `computerShipGrid` state (removed), `hoverCell` not cleared on random placement (fixed), `autoPlaceShips` retry loop without cap (fixed). None were pre-existing architecture problems — all were implementation details. The factory pattern and overall structure required zero changes.

---

## Side-by-Side Comparison

| Dimension | Direct | /ah | Winner |
|---|---|---|---|
| Visual quality | 4/5 | 5/5 | **/ah** |
| Code quality | 4/5 | 5/5 | **/ah** |
| Feature completeness | 12/12 | 12/12 | Tie |
| **Total** | **20/22** | **22/22** | **/ah** |

---

## Verdict

**/ah wins decisively: 22/22 vs 20/22.** The margin is wider than Breakout (20/21) and the gap is the same: architecture and visual quality both improved via decomposition.

**Dynamic model selection worked correctly.** Step 0 ran before decomposition and produced `FAST=haiku, CAPABLE=sonnet, APEX=opus` from the Agent tool enum. Both subtasks were correctly classified as CAPABLE (complex, multi-file judgment, integration concerns). No advisor calls needed — tasks were well-specified.

**Why /ah wins on code quality:** Subtask 1 had zero pressure to also handle visuals, so it made the right architectural decisions immediately: factory state, available-cells AI, event delegation. The direct build made the same mistakes as in the Breakout benchmark (retry loop, `e.key`) and needed post-review fixes.

**Why /ah wins on visual quality:** Dedicated second pass with no mechanics pressure produced a distinctly more polished result — distinctive font, per-type ship colors, animated HUD with ship-level indicators. The direct build's visuals are good but generic.

**Token cost:** ~67,311 for /ah vs ~28,103 for direct — approximately 2.4× more expensive. Zero Opus advisor calls; both subtasks ran to completion without escalation.

**When /ah justifies its overhead:** Tasks where architecture AND visual polish both matter. The forced decomposition separates these concerns naturally — mechanics-first produces better code, visuals-second produces better aesthetics. Both improve.

**When it doesn't:** Single-concern tasks where the spec is fully constrained. A visuals-only or mechanics-only task wouldn't benefit from the separation.
