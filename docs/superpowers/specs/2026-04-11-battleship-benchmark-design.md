# Battleship Benchmark Design

**Date:** 2026-04-11
**Branch:** feat/dynamic-model-selection
**Purpose:** Validate the updated /ah skill (dynamic model selection) by building the same game twice — once directly, once via /ah — and scoring both on visual quality, code quality, and feature completeness.

---

## Goal

Build a browser-based Battleship game to the spec below. Build it twice from the identical spec:
- **Run 1 (Direct):** Single pass, current session model, no hierarchy
- **Run 2 (/ah):** 3-tier advisor hierarchy with dynamic model selection

Score both and record results in `benchmark/results-battleship.md`.

---

## Game Spec

Single-page app (React 18 + htm via CDN, no build step). Modular JS files acceptable. Two 10×10 grids side by side (player left, computer right).

### Ship Placement Phase

Player places 5 ships on their own grid before battle begins:
- **Manual placement:** click a cell to anchor ship, toggle horizontal/vertical orientation
- **Random button:** auto-places all 5 ships at valid non-overlapping positions

Ships:

| Name | Size |
|---|---|
| Carrier | 5 |
| Battleship | 4 |
| Cruiser | 3 |
| Submarine | 3 |
| Destroyer | 2 |



### Battle Phase

Turn-based. Player goes first.

1. Player clicks a cell on the **computer's grid** to fire
2. Computer immediately fires at a **random un-fired cell** on the player's grid (no AI strategy — purely random, no repeat shots)
3. Both shots resolve before the next turn

### Hit / Miss / Sunk Rules

- **Miss:** cell marked with a dim marker (grey/white)
- **Hit:** cell marked with a red glow marker
- **Sunk:** when all cells of a ship are hit, the full ship is revealed on the board and marked as sunk

### Win / Lose Conditions

- **Win:** all 5 computer ships sunk
- **Lose:** all 5 player ships sunk

---

## Feature Checklist (12 points, 1 each)

1. Two 10×10 grids rendered correctly
2. Manual ship placement (click to place, toggle orientation)
3. Random placement button
4. Player can fire at computer grid (click)
5. Computer fires randomly with no repeat shots
6. Hit / miss distinction (visual markers)
7. Sunk ship fully revealed on board
8. Turn indicator (whose turn / whose grid to click)
9. Start screen (before placement phase)
10. Win screen (all computer ships sunk)
11. Lose screen (all player ships sunk)
12. Ship status sidebar (ships remaining per side)

---

## Visual Requirements

Both builds must attempt these:
- Dark background
- Neon/glowing hit markers (red glow for hits, dim for misses)
- Ships rendered with visible fill on the player's own grid
- Hit effect: explosion or ripple animation on hit (CSS or canvas)
- Cell hover highlight on the attack grid
- Styled start / win / lose screens (not browser defaults)
- HUD showing ship counts remaining per side

---

## Scoring

| Dimension | Max |
|---|---|
| Visual quality | 5 |
| Code quality | 5 |
| Feature completeness | 12 |
| **Total** | **22** |

**Visual quality rubric (1–5):**
- 5: Cohesive, polished, effects feel intentional, memorable aesthetic
- 4: Good polish, one or two effects missing or rough
- 3: Functional visuals, minimal polish
- 2: Plain/unstyled with minor effort
- 1: Bare browser defaults

**Code quality rubric (1–5):**
- 5: Clean state management, no fragile hacks, separation of concerns, handles edge cases
- 4: Good structure, one or two minor weaknesses
- 3: Works but fragile in places
- 2: Spaghetti, global state, hard to follow
- 1: Barely functional

---

## Output Files

| File | Purpose |
|---|---|
| `benchmark/direct/battleship.html` | Run 1 output |
| `benchmark/ah/battleship.html` | Run 2 output |
| `docs/benchmark/direct/battleship.html` | GitHub Pages copy of Run 1 |
| `docs/benchmark/ah/battleship.html` | GitHub Pages copy of Run 2 |
| `benchmark/results-battleship.md` | Scored comparison |
| `benchmark/ah/notes-battleship.md` | /ah run metadata (subtasks, models, tokens) |
