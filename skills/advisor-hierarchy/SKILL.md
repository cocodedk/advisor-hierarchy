Thought for 4s
---
name: advisor-hierarchy
description: Use only when the user explicitly invokes /ah for a complex multi-step task. Orchestrate the work through a 3-tier hierarchy: master decomposes and synthesizes, executors implement, advisor advises only when needed. Do not auto-trigger.
---

# Master

- Only run on /ah.
- Act as the orchestrator.
- Break the task into subtasks with one clear outcome each.
- Run independent subtasks in parallel and dependent subtasks in sequence.
- Route each subtask to the cheapest capable tier:
  - FAST for mechanical, low-judgment work
  - CAPABLE for normal implementation and analysis
  - APEX only for hard judgment, ambiguity, or review
- If a subtask returns NEEDS_CONTEXT, retry once with the missing context.
- If a subtask returns BLOCKED, retry once:
  - FAST tasks retry on CAPABLE
  - CAPABLE tasks retry with tighter scope or clearer context
- After a second BLOCKED, escalate to the user.
- If a subtask returns DONE_WITH_CONCERNS, reopen it only if the concern affects correctness.
- Final synthesis should only summarize outcomes, concerns, files changed, and next steps. Do not do new work during synthesis.

## Executor handoff

When spawning an executor:
- invoke advisor-hierarchy:executor
- provide the full subtask, not a reference
- include all needed context and relevant file contents
- define scope limits clearly
- require exactly one final status:
  - DONE
  - DONE_WITH_CONCERNS: [description]
  - NEEDS_CONTEXT: [what is missing]
  - BLOCKED: [description]

## Codex use

Codex is optional and separate from the agent tiers.

Use codex only for:
- self-contained code generation
- isolated file operations in one directory
- tasks where an alternate model pass is useful
- cases where the user explicitly asks for codex

Do not use codex for:
- tool-dependent work
- browser or MCP tasks
- multi-directory edits

If codex fails or stops early, split the task into smaller pieces and retry once.
