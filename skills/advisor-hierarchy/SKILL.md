---
name: advisor-hierarchy
description: Use when executing a complex multi-step task using a 3-tier agent hierarchy. Master orchestrates, executors implement, Apex model advises on demand. Activated via /ah command — do NOT auto-trigger.
---

# Advisor Hierarchy — Master

> ⚠ The pseudocode below describes **your own behavior**. Follow it — do not run it.

```python
# Primitives:
# tiers               → {FAST: cheapest, CAPABLE: balanced, APEX: most capable}
#                        (inspect `model` enum on Agent tool to populate)
# mechanical(task)    → 1-2 files, unambiguous spec, no judgment required
# dependent(a, b)     → b requires output from a to proceed
# blocked_once(t)     → this subtask has already returned BLOCKED once

def map_tiers():
    values = Agent.tool.model.enum  # sorted cheapest → most capable
    if len(values) >= 3:
        FAST, CAPABLE, APEX = values[0], values[1], values[-1]
    elif len(values) == 2:
        FAST = CAPABLE = values[0]; APEX = values[1]
    else:
        FAST = CAPABLE = APEX = values[0]
    record(f"FAST={FAST}, CAPABLE={CAPABLE}, APEX={APEX}")

def classify(subtask):
    return FAST if mechanical(subtask) else CAPABLE  # doubt → CAPABLE

def order(subtasks):
    # group into waves: each wave's tasks are mutually independent
    waves = []
    for t in subtasks:
        wave = next((w for w in waves if not any(dependent(d, t) for d in w)), None)
        if wave is None:
            waves.append([t])
        else:
            wave.append(t)
    return waves  # dispatch each wave in one message (parallel); waves are sequential

def handle(subtask, status):
    if status == DONE:
        pass  # proceed

    elif status.startswith("DONE_WITH_CONCERNS"):
        concern = status.split(":", 1)[1]
        if affects_correctness(concern):
            spawn(classify(subtask), fix_task(concern))
        else:
            note(concern)  # observational — record and proceed

    elif status.startswith("NEEDS_CONTEXT"):
        missing = status.split(":", 1)[1]
        spawn(classify(subtask), subtask, extra_context=missing)

    elif status == BLOCKED:
        if not blocked_once(subtask):
            if classify(subtask) == FAST:
                spawn(CAPABLE, subtask)       # upgrade tier
            else:
                spawn(CAPABLE, subtask, context="focused: " + last_error(subtask))
        else:
            escalate_to_user(subtask)         # second BLOCKED — no re-dispatch

def run(task):
    map_tiers()                               # Step 0
    subtasks = decompose(task)                # Step 1: each subtask has one clear outcome
    classified = [(t, classify(t)) for t in subtasks]  # Step 2: classify before dispatch
    waves = order(classified)                 # Step 3: dependency ordering

    results = []
    for wave in waves:                        # Step 4: spawn executors per wave
        wave_results = [spawn(tier, t) for t, tier in wave]  # parallel within wave
        for subtask, status in wave_results:
            handle(subtask, status)           # Step 5: handle each result
        results.extend(wave_results)

    synthesize(results)                       # Step 6: report to user

def synthesize(results):
    # Report: one line per subtask (what was done), concerns, files changed, next steps
    # Never execute, write files, or call tools — synthesize only
    pass
```

## Executor spawn template

```text
Agent({
  model: "<tier value>",
  description: "[subtask name]",
  prompt: `Invoke \`advisor-hierarchy:executor\` skill first.

## Your task
[complete description — not a reference to another task]

## Codebase context
Language / Framework / Test runner / Key conventions

## Relevant file contents
[paste every file the executor needs — never tell it to read files itself]

## Constraints
- Only modify files in scope
- Report: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`
})
```
