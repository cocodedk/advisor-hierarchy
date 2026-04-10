# Advisor Hierarchy Skill — Design Spec

**Date:** 2026-04-10
**Status:** Approved, pending implementation

---

## Overview

A 3-tier agent hierarchy implemented as a Claude Code skill set. Mirrors the Anthropic Advisor Tool API pattern in Claude Code: cheap models execute, Opus advises on demand. Activated explicitly via slash command. Globally available across all projects.

**Primary use cases:** Software engineering (coding, refactoring, testing), writing tasks (CVs, job applications).

---

## Activation

```bash
/advisor-hierarchy "your task description here"
```

Explicit invocation only — the user decides when the hierarchy is worth the overhead. Not auto-triggered.

---

## File Structure

```
~/projects/advisor-hierarchy/
  docs/
    specs/
      2026-04-10-advisor-hierarchy-design.md   ← this file
  skills/
    advisor-hierarchy/
      SKILL.md        ← master skill (slash command entry point)
      executor.md     ← executor rules (loaded by spawned executor agents)
      advisor.md      ← advisor rules (loaded by spawned advisor agents)
  install.sh          ← copies skills to ~/.claude/skills/ if symlink fails
  README.md
```

**Installation:**
```bash
# preferred
ln -s ~/projects/advisor-hierarchy/skills/advisor-hierarchy ~/.claude/skills/advisor-hierarchy

# fallback if symlinks don't work
bash install.sh
```

---

## Architecture

```
Session (master)
  │  Loads: SKILL.md
  │  Role: decompose, delegate, synthesize. Never executes.
  │
  ├─── Haiku executor          (mechanical subtasks)
  │      Loads: executor.md
  │      Role: execute. Consults Opus ≤3x if needed.
  │           └─── Opus advisor (on demand)
  │                  Loads: advisor.md
  │                  Role: advise only. No tools. No output to user.
  │
  └─── Sonnet executor         (complex/judgment subtasks)
         Loads: executor.md
         Role: execute. Consults Opus ≤3x if needed.
              └─── Opus advisor (on demand)
                     Loads: advisor.md
                     Role: advise only. No tools. No output to user.
```

### How each tier self-configures

The master spawns executors with a crafted prompt that ends with:
> "Your first action is to invoke the `advisor-hierarchy:executor` skill."

When an executor needs advice, it spawns an Opus agent whose prompt ends with:
> "Your first action is to invoke the `advisor-hierarchy:advisor` skill."

Each agent loads its own ruleset. No cross-contamination of context.

### Model selection logic (master decides)

| Subtask type | Executor model |
|---|---|
| Mechanical (isolated, clear spec, 1-2 files) | Haiku |
| Complex (multi-file, judgment calls, integration) | Sonnet |
| Advisor (always) | Opus |

---

## Rules Per Tier

### Master (`SKILL.md`)

1. **Decompose** the task into subtasks before spawning anything
2. **Classify** each subtask: mechanical → Haiku, complex/judgment → Sonnet
3. **Identify dependencies** — sequential if subtask B needs output of A, parallel otherwise
4. **Spawn** executors with full context (task text, relevant files, codebase background)
5. **Never execute** code, write files, or call tools itself — coordination only
6. **Collect** executor results and synthesize a final report to the user
7. **Escalate** to user if an executor returns BLOCKED and re-dispatch doesn't resolve it

### Executor (`executor.md`)

1. **Read the task fully** before starting — surface questions before touching code
2. **Execute end-to-end**: write, test, iterate
3. **Consult Opus** (spawn advisor) at these moments only:
   - Before committing to an approach on a non-trivial decision
   - When stuck (same error 2+ times, or approach not converging)
   - When complete, before reporting DONE on complex tasks
4. **Cap advisor calls at 3** per task — if still stuck after 3, report BLOCKED
5. **Follow advisor guidance** unless direct evidence contradicts it — then surface the conflict in one more advisor call
6. **Report** one of: `DONE` / `DONE_WITH_CONCERNS` / `NEEDS_CONTEXT` / `BLOCKED`

### Advisor (`advisor.md`)

1. **Read the full context** passed by the executor
2. **Return a plan** — text only, under ~150 words, enumerated steps
3. **No tool calls** — no file reads, no bash, no searches
4. **No user-facing output** — the executor is your only audience
5. **No execution** — never "I'll do X", only "you should do X"
6. **Stop signal** — if the task is fundamentally broken or out of scope, say so explicitly so the executor can escalate

---

## Data Flow

```
User: /advisor-hierarchy "refactor auth module to use JWT"

Master:
  → Decomposes into: [remove old session logic, implement JWT middleware, update tests]
  → Classifies: [Haiku, Sonnet, Haiku]
  → Identifies: sequential (middleware before tests)

Haiku executor (task 1: remove old session logic):
  → No advisor needed — mechanical
  → Reports: DONE

Sonnet executor (task 2: implement JWT middleware):
  → Spawns Opus advisor: "should I use RS256 or HS256 given this codebase?"
  → Opus: "Use HS256 — no key distribution infrastructure present, simpler secret rotation"
  → Implements, tests pass
  → Reports: DONE

Haiku executor (task 3: update tests):
  → Spawns Opus advisor: "existing test fixtures use session tokens, what's the migration pattern?"
  → Opus: "replace session mocks with JWT factory helper, keep fixture structure identical"
  → Implements
  → Reports: DONE

Master:
  → Synthesizes: all 3 tasks complete, JWT migration done
  → Reports to user
```

---

## Error Handling

| Executor status | Master action |
|---|---|
| `DONE` | Mark complete, proceed |
| `DONE_WITH_CONCERNS` | Read concerns, assess, proceed or re-dispatch |
| `NEEDS_CONTEXT` | Provide missing context, re-dispatch same model |
| `BLOCKED` (1st time) | Re-dispatch with Sonnet if was Haiku, else re-dispatch with more context |
| `BLOCKED` (2nd time) | Escalate to user with full context |

Advisor errors (tool failure, overloaded):
- Executor continues without advice — does not hard-fail
- Counts as one of the 3 advisor call slots

---

## Limitations & Known Trade-offs

- More round trips than the native Anthropic Advisor Tool API (no server-side optimization)
- No mid-generation consultation — checkpoints are coarser
- Master context can grow on very long multi-task runs
- Advisor cap (3 calls) is enforced by executor rules, not by the framework — relies on skill compliance
- Symlink support in Claude Code skill loader unverified — install.sh fallback provided

---

## Out of Scope (v1)

- Parallel executor spawning (v1 is sequential per dependency order)
- Executor-to-executor communication
- Persistent state across sessions
- Auto-trigger mode

