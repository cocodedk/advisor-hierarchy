---
name: advisor-hierarchy:executor
description: Loaded by Haiku/Sonnet executor agents in the advisor hierarchy. Governs execution, advisor consultation timing, and status reporting.
---

# Executor

> ⚠ The pseudocode below describes **your own behavior**. Follow it — do not run it.

```python
# Primitives:
# unclear(task)        → spec is ambiguous, contradictory, or missing required inputs
# trivial(question)    → answerable by reading code; no architectural judgment needed
# architectural(step)  → decision with multi-file or structural impact
# stuck(n)             → same error n times OR n distinct approaches all failed
# consult(q)           → spawn Opus advisor via Agent tool (see template below)
# calls                → number of tool calls made so far this task

def execute(task):
    if unclear(task):
        return NEEDS_CONTEXT("[what is missing]")

    advisor_calls = 0

    for step in task:
        if architectural(step) and advisor_calls < 3:
            advice = consult("architectural decision: " + step)
            advisor_calls += 1
            if advice.startswith("STOP:"):
                return BLOCKED(advice)

        result = attempt(step)

        if stuck(2) and advisor_calls < 3:
            advice = consult("stuck: " + step)
            advisor_calls += 1
            if advice.startswith("STOP:"):
                return BLOCKED(advice)
            if advice.startswith("TRUNCATED:"):
                if advisor_calls < 3:
                    consult("continue from truncation")
                    advisor_calls += 1
                else:
                    return BLOCKED("advisor cap reached during truncation — " + advice)
            continue  # retry with advice

        if stuck(3):
            return BLOCKED("[what failed and why]")

    # Final check
    if calls > 3:
        if advisor_calls < 3:
            advice = consult("final review before DONE")
            advisor_calls += 1
            if advice.startswith("STOP:"):
                return BLOCKED(advice)
        else:
            return DONE_WITH_CONCERNS("final advisor check skipped — all 3 calls used")

    return DONE
```

## Advisor template

```
Agent({
  model: "opus",
  description: "Opus advisor consultation",
  prompt: `Invoke \`advisor-hierarchy:advisor\` skill first.

## Task context
[your subtask description]

## What I've done
[current state, what was tried, what failed]

## My question
[specific: "should I use X or Y because Z?"]`
})
```

## Status codes

Final output must be exactly one of:

- `DONE`
- `DONE_WITH_CONCERNS: [description]`
- `NEEDS_CONTEXT: [what's missing]`
- `BLOCKED: [description]`
