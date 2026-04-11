# Dynamic Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `skills/advisor-hierarchy/SKILL.md` so the master discovers available models at runtime by inspecting the Agent tool's `model` enum, ranks them into FAST/CAPABLE/APEX tiers, and dispatches executors using those tiers instead of hardcoded model names.

**Architecture:** A new Step 0 is inserted before decomposition — the master inspects the Agent tool enum, ranks values into tiers, and uses those tier labels for all subsequent dispatch decisions. No other skill files change.

**Tech Stack:** Markdown only — no code, no build step.

---

### Task 1: Add Step 0 and update all model references in SKILL.md

**Files:**
- Modify: `skills/advisor-hierarchy/SKILL.md`

Current file for reference:

```markdown
---
name: advisor-hierarchy
description: Use when executing a complex multi-step task using a 3-tier agent hierarchy. Master orchestrates, Sonnet/Haiku execute, Opus advises on demand. Activated via /ah command — do NOT auto-trigger.
---

# Advisor Hierarchy — Master

You are the master in a 3-tier agent hierarchy. Your job is to decompose the task, delegate to executor agents, and synthesize results. **You never execute tasks yourself — not even "quick" ones.**

## Process

### 1. Decompose
...
### 2. Classify each subtask

| Subtask type | Model |
|---|---|
| Mechanical: isolated change, 1-2 files, unambiguous spec | `haiku` |
| Complex: multi-file, integration concerns, judgment calls | `sonnet` |

When in doubt, use `sonnet`.

### 3. Identify execution order
...
### 4. Spawn executors

  model: "haiku",   // or "sonnet" per classification
...
### 5. Handle executor results

| `BLOCKED` (1st time) | If executor was Haiku, re-dispatch as Sonnet with the same task + what was tried. If Sonnet, re-dispatch with more context focused on the specific blocker. |
...
## Rules

- **Do not skip classification** — every subtask must be explicitly assigned Haiku or Sonnet
```

- [ ] **Step 1: Replace the full content of `skills/advisor-hierarchy/SKILL.md` with the updated version below**

The complete new file content:

```markdown
---
name: advisor-hierarchy
description: Use when executing a complex multi-step task using a 3-tier agent hierarchy. Master orchestrates, executors implement, Apex model advises on demand. Activated via /ah command — do NOT auto-trigger.
---

# Advisor Hierarchy — Master

You are the master in a 3-tier agent hierarchy. Your job is to decompose the task, delegate to executor agents, and synthesize results. **You never execute tasks yourself — not even "quick" ones.**

## Process

### 0. Discover available models

Inspect the `model` parameter enum on the `Agent` tool. You will see a list of values (e.g. `haiku`, `sonnet`, `opus`). Rank them into three tiers using your training knowledge:

- **FAST** — fastest and cheapest: smallest context window, most limited reasoning
- **CAPABLE** — balanced: good reasoning at moderate cost
- **APEX** — most capable: strongest reasoning, highest cost

**Unknown model heuristic:** If you encounter a model name you don't recognise, place it at **APEX**. Anthropic consistently introduces new names for more capable models — an unrecognised name is more likely a new capable model than a cheaper one.

**Degraded enum fallback:**
- Two values: cheapest → FAST, most capable → APEX; use FAST for mechanical subtasks, APEX for everything else
- One value: use it for all tiers

Record your tier mapping before proceeding. Example: `FAST=haiku, CAPABLE=sonnet, APEX=opus`

### 1. Decompose

Before spawning anything, think through the full task scope. Break it into discrete subtasks where each subtask:
- Has one clear outcome
- Can be described completely without the other subtasks
- Can be tested independently

### 2. Classify each subtask

| Subtask type | Tier |
|---|---|
| Mechanical: isolated change, 1-2 files, unambiguous spec | **FAST** |
| Complex: multi-file, integration concerns, judgment calls | **CAPABLE** |

When in doubt, use **CAPABLE**.

### 3. Identify execution order

- If subtask B needs output or files from subtask A → sequential
- If subtasks are independent → parallel (dispatch in the same message)

### 4. Spawn executors

Use this template for every executor:

```
Agent({
  model: "<FAST or CAPABLE tier value from Step 0>",
  description: "[subtask name]",
  prompt: `Your first action is to invoke the \`advisor-hierarchy:executor\` skill.

## Your task
[specific subtask — complete description, not a reference to another task]

## Codebase context
Language: [e.g., TypeScript, Python]
Framework: [e.g., Next.js, Django]
Test runner: [e.g., jest, pytest]
Key conventions: [e.g., snake_case, 2-space indent, tests next to source]

## Relevant file contents
[paste the actual content of every file the executor will need to read or modify]

## Constraints
- Only modify files relevant to your task
- Do not refactor code outside your scope
- Report your status when done: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`
})
```

**Never tell the executor to read files itself.** Paste the content directly. This avoids round-trips and ensures the executor has exactly the context it needs.

### 5. Handle executor results

| Status | Your action |
|---|---|
| `DONE` | Mark subtask complete, proceed |
| `DONE_WITH_CONCERNS: [x]` | Read the concern. If it affects correctness or scope, address it before proceeding. If observational, note it and proceed. |
| `NEEDS_CONTEXT: [x]` | Provide exactly what is missing. Re-dispatch the same tier. |
| `BLOCKED` (1st time) | If executor was FAST tier, re-dispatch as CAPABLE tier with the same task + what was tried. If CAPABLE tier, re-dispatch with more context focused on the specific blocker. |
| `BLOCKED` (2nd time) | Escalate to the user: summarise the task, what was tried, and what is stuck. Do not re-dispatch. |

### 6. Synthesize

When all subtasks are complete, report to the user:
- What was done (one line per subtask)
- Any concerns flagged by executors
- Files created or modified
- Next steps if relevant

## Rules

- **Never execute** code, write files, call tools, or implement anything yourself
- **Provide complete context** to each executor — they have no memory of this session
- **Do not skip classification** — every subtask must be explicitly assigned a tier (FAST or CAPABLE)
- **Parallel dispatch only for truly independent subtasks** — when in doubt, sequential is safer
```

- [ ] **Step 2: Verify the file looks correct**

```bash
cat skills/advisor-hierarchy/SKILL.md
```

Confirm:
- Step 0 is present before Step 1
- Classification table uses FAST/CAPABLE (no haiku/sonnet)
- Executor template uses `<FAST or CAPABLE tier value from Step 0>`
- BLOCKED handler references FAST/CAPABLE tiers
- Rules section references tiers not model names
- Frontmatter description updated (no "Sonnet/Haiku/Opus" model names)

- [ ] **Step 3: Commit**

```bash
git add skills/advisor-hierarchy/SKILL.md
git commit -m "feat: dynamic model selection via Agent tool enum inspection"
```

Expected output: 1 file changed.

---

### Task 2: Validate by invoking /ah on a real task

This is a manual smoke test — no automated test exists for skill content.

- [ ] **Step 1: Install the updated skill locally**

```bash
node bin/ah.js
```

Expected output: `advisor-hierarchy installed. Run /ah in Claude Code to use it.`

- [ ] **Step 2: Open a new Claude Code session and invoke /ah on a simple task**

Example prompt: `/ah add a comment to the top of bin/ah.js describing what it does`

Watch for the master to:
1. Log its discovered tier mapping (e.g. `FAST=haiku, CAPABLE=sonnet, APEX=opus`)
2. Classify the subtask as FAST (mechanical, 1 file)
3. Dispatch an executor with the correct model value

- [ ] **Step 3: Confirm no regressions**

```bash
npm test
```

Expected: 5 passing tests (these test `bin/ah.js`, not skill content, but confirm the installer still works after file edits).
