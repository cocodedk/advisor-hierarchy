# Battleship Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the same Battleship game twice from an identical spec — once directly, once via /ah — then score both and record results.

**Architecture:** Four sequential tasks: direct build → /ah build → copy to docs/ → score and write results. Tasks 1 and 2 are independent game builds from the same spec; Tasks 3–4 depend on both builds being complete.

**Tech Stack:** Vanilla HTML/CSS/JS (Canvas or DOM, builder's choice), no dependencies, single file per build.

---

## Game Spec (shared — used verbatim in Tasks 1 and 2)

Single HTML file. Two 10×10 grids side by side: player grid (left), computer grid (right).

**Ship placement phase:**
- Player places 5 ships manually: click a cell to anchor, press R or click a toggle button to rotate orientation (horizontal/vertical)
- "Random" button auto-places all 5 ships at valid non-overlapping positions
- Ships: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2)
- Computer ships are auto-placed randomly (hidden from player)

**Battle phase (turn-based, player first):**
1. Player clicks a cell on the computer's grid to fire
2. Resolve hit or miss, mark the cell
3. Computer fires at a random un-fired cell on the player's grid (no repeat shots)
4. Resolve hit or miss, mark the cell
5. Repeat until all ships on one side are sunk

**Hit/miss/sunk:**
- Miss: dim grey/white marker
- Hit: red glow marker
- Sunk: when all cells of a ship are hit, reveal the full ship outline on the board

**Win condition:** all 5 computer ships sunk → show win screen
**Lose condition:** all 5 player ships sunk → show lose screen

**Visual requirements:**
- Dark background (#0a0a1a or similar)
- Ships rendered with visible colored fill on player's own grid
- Neon red glow on hit cells
- Dim marker on miss cells
- Hover highlight on attack grid (computer's grid during player turn)
- Hit effect: CSS or canvas explosion/ripple animation on hit
- Turn indicator showing whose turn it is
- Status HUD: ships remaining per side (e.g. "You: 4 ships  Computer: 3 ships")
- Styled start screen, win screen, lose screen (not browser defaults)

**Feature checklist (12 points):**
1. Two 10×10 grids rendered correctly
2. Manual ship placement (click + orientation toggle)
3. Random placement button
4. Player can fire at computer grid (click)
5. Computer fires randomly with no repeat shots
6. Hit / miss distinction (visual markers)
7. Sunk ship fully revealed on board
8. Turn indicator
9. Start screen
10. Win screen
11. Lose screen
12. Ship status HUD (ships remaining per side)

---

### Task 1: Direct build — `benchmark/direct/battleship.html`

**Files:**
- Create: `benchmark/direct/battleship.html`

This task is a direct single-pass build. No hierarchy, no subagents. Build the complete game in one shot.

- [ ] **Step 1: Create `benchmark/direct/battleship.html`**

Build the complete Battleship game per the Game Spec above. Requirements:
- Single HTML file, all CSS and JS inline
- Canvas or DOM grid — builder's choice
- All 12 features from the feature checklist must be present
- All visual requirements must be attempted

The file must be self-contained and playable by opening in a browser.

- [ ] **Step 2: Verify the game is playable**

Open `benchmark/direct/battleship.html` in a browser and confirm:
- Ship placement phase works (manual + random)
- Battle phase works (click to fire, computer fires back)
- Hit/miss/sunk all render correctly
- Win and lose screens appear
- Status HUD updates

- [ ] **Step 3: Commit**

```bash
mkdir -p benchmark/direct
git add benchmark/direct/battleship.html
git commit -m "benchmark: direct Battleship build (Run 1)"
```

---

### Task 2: /ah build — `benchmark/ah/battleship.html`

**Files:**
- Create: `benchmark/ah/battleship.html`
- Create: `benchmark/ah/notes-battleship.md`

This task uses the /ah advisor hierarchy. The master must decompose the game build into subtasks, classify each, and dispatch executors. Do NOT build the game directly — invoke `/ah` via the Skill tool with `skill: "advisor-hierarchy"` and task the hierarchy with building the game.

The hierarchy spec to pass to /ah:

> Build a complete Battleship game as a single HTML file at `benchmark/ah/battleship.html`. The game spec is: [paste the entire Game Spec section from this plan verbatim]. All 12 features and all visual requirements must be implemented. The file must be self-contained and playable.

- [ ] **Step 1: Invoke the /ah hierarchy**

Use the Skill tool: `skill: "advisor-hierarchy"` with the full game spec as the task. The master will:
1. Run Step 0 (discover available models, record tier mapping)
2. Decompose into subtasks (e.g. core mechanics + visual polish)
3. Classify and dispatch executors
4. Synthesize results

- [ ] **Step 2: Verify the game is playable**

Open `benchmark/ah/battleship.html` in a browser and confirm the same checklist as Task 1.

- [ ] **Step 3: Write `benchmark/ah/notes-battleship.md`**

Record the hierarchy run metadata:

```markdown
# /ah Run Notes — Battleship

## Model discovery
[What tiers were discovered: FAST=X, CAPABLE=Y, APEX=Z]

## Task decomposition
[List each subtask, which tier/model was used, sequential or parallel]

## Advisor consultations
[How many times was APEX tier consulted, and for what]

## Token metadata
- Subtask 1 total tokens: [N]
- Subtask 2 total tokens: [N]  (if applicable)
- **Total: ~[N] tokens**
```

- [ ] **Step 4: Commit**

```bash
mkdir -p benchmark/ah
git add benchmark/ah/battleship.html benchmark/ah/notes-battleship.md
git commit -m "benchmark: /ah Battleship build (Run 2)"
```

---

### Task 3: Copy builds to docs/ for GitHub Pages

**Files:**
- Create: `docs/benchmark/direct/battleship.html`
- Create: `docs/benchmark/ah/battleship.html`

- [ ] **Step 1: Copy both files**

```bash
mkdir -p docs/benchmark/direct docs/benchmark/ah
cp benchmark/direct/battleship.html docs/benchmark/direct/battleship.html
cp benchmark/ah/battleship.html docs/benchmark/ah/battleship.html
```

- [ ] **Step 2: Commit**

```bash
git add docs/benchmark/direct/battleship.html docs/benchmark/ah/battleship.html
git commit -m "docs: add Battleship benchmark games to GitHub Pages"
```

---

### Task 4: Score both builds and write results

**Files:**
- Create: `benchmark/results-battleship.md`

Score both builds against the spec. Open each HTML file in a browser, play through the full game, and evaluate each dimension honestly.

**Scoring rubric:**

Visual quality (1–5):
- 5: Cohesive, polished, effects feel intentional, memorable aesthetic
- 4: Good polish, one or two effects missing or rough
- 3: Functional visuals, minimal polish
- 2: Plain with minor effort
- 1: Bare browser defaults

Code quality (1–5):
- 5: Clean state management, separation of concerns, no fragile hacks, handles edge cases
- 4: Good structure, one or two minor weaknesses
- 3: Works but fragile in places
- 2: Spaghetti, global state, hard to follow
- 1: Barely functional

Feature completeness: count which of the 12 checklist items are present and working.

- [ ] **Step 1: Score Run 1 (Direct)**

Play `benchmark/direct/battleship.html`. Evaluate all 3 dimensions. Note specific strengths and weaknesses for each.

- [ ] **Step 2: Score Run 2 (/ah)**

Play `benchmark/ah/battleship.html`. Evaluate all 3 dimensions. Note specific strengths and weaknesses.

- [ ] **Step 3: Write `benchmark/results-battleship.md`**

```markdown
# Battleship Benchmark Results

**Date:** 2026-04-11
**Spec:** Both runs built from identical shared spec — see `docs/superpowers/specs/2026-04-11-battleship-benchmark-design.md`

---

## Run 1: Direct (no /ah)

| Dimension | Score |
|---|---|
| Visual quality | X/5 |
| Code quality | X/5 |
| Feature completeness | X/12 |
| **Total** | **X/22** |

**Feature checklist:**
- [ ] Two 10×10 grids rendered correctly
- [ ] Manual ship placement
- [ ] Random placement button
- [ ] Player can fire at computer grid
- [ ] Computer fires randomly, no repeats
- [ ] Hit / miss distinction
- [ ] Sunk ship fully revealed
- [ ] Turn indicator
- [ ] Start screen
- [ ] Win screen
- [ ] Lose screen
- [ ] Ship status HUD

**Notes:**
[Specific observations about what worked, what didn't, code structure observations]

---

## Run 2: /ah hierarchy

| Dimension | Score |
|---|---|
| Visual quality | X/5 |
| Code quality | X/5 |
| Feature completeness | X/12 |
| **Total** | **X/22** |

**Feature checklist:**
- [ ] Two 10×10 grids rendered correctly
- [ ] Manual ship placement
- [ ] Random placement button
- [ ] Player can fire at computer grid
- [ ] Computer fires randomly, no repeats
- [ ] Hit / miss distinction
- [ ] Sunk ship fully revealed
- [ ] Turn indicator
- [ ] Start screen
- [ ] Win screen
- [ ] Lose screen
- [ ] Ship status HUD

**Hierarchy notes:**
- Subtasks: [N]
- Models used (tiers): [FAST=X × N, CAPABLE=Y × N]
- Advisor calls: [N]
- Tokens: ~[N] total

**Notes:**
[Specific observations]

---

## Side-by-Side Comparison

| Dimension | Direct | /ah | Winner |
|---|---|---|---|
| Visual quality | X/5 | X/5 | [winner or Tie] |
| Code quality | X/5 | X/5 | [winner or Tie] |
| Feature completeness | X/12 | X/12 | [winner or Tie] |
| **Total** | **X/22** | **X/22** | **[winner]** |

---

## Verdict

[3–5 sentences: what the scores mean, whether /ah justified its overhead, what the dynamic model selection added or didn't add compared to the Breakout benchmark]
```

- [ ] **Step 4: Commit**

```bash
git add benchmark/results-battleship.md
git commit -m "benchmark: Battleship results scored"
```
