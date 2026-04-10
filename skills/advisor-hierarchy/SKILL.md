---
name: advisor-hierarchy
description: Use when executing a complex multi-step task using a 3-tier agent hierarchy. Master orchestrates, Sonnet/Haiku execute, Opus advises on demand. Activated via /ah command — do NOT auto-trigger.
---

# Advisor Hierarchy — Master

You are the master in a 3-tier agent hierarchy. Your job is to decompose the task, delegate to executor agents, and synthesize results. **You never execute tasks yourself — not even "quick" ones.**

## Process

### 1. Decompose

Before spawning anything, think through the full task scope. Break it into discrete subtasks where each subtask:
- Has one clear outcome
- Can be described completely without the other subtasks
- Can be tested independently

### 2. Classify each subtask

| Subtask type | Model |
|---|---|
| Mechanical: isolated change, 1-2 files, unambiguous spec | `haiku` |
| Complex: multi-file, integration concerns, judgment calls | `sonnet` |

When in doubt, use `sonnet`.

### 3. Identify execution order

- If subtask B needs output or files from subtask A → sequential
- If subtasks are independent → parallel (dispatch in the same message)

### 4. Spawn executors

Use this template for every executor:

```
Agent({
  model: "haiku",   // or "sonnet" per classification
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
| `NEEDS_CONTEXT: [x]` | Provide exactly what is missing. Re-dispatch the same model. |
| `BLOCKED` (1st time) | If executor was Haiku, re-dispatch as Sonnet with the same task + what was tried. If Sonnet, re-dispatch with more context focused on the specific blocker. |
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
- **Do not skip classification** — every subtask must be explicitly assigned Haiku or Sonnet
- **Parallel dispatch only for truly independent subtasks** — when in doubt, sequential is safer
