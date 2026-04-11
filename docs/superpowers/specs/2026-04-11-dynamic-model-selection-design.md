# Dynamic Model Selection Design

**Date:** 2026-04-11
**Branch:** feat/dynamic-model-selection

---

## Goal

Update `skills/advisor-hierarchy/SKILL.md` so the master discovers available models at runtime by inspecting the `Agent` tool's `model` enum, ranks them into tiers, and uses those tiers for dispatch — instead of hardcoding `haiku`, `sonnet`, and `opus`.

## Problem

The current skill hardcodes three model names in two places:
1. The classification table (`haiku` for mechanical, `sonnet` for complex)
2. Executor dispatch templates (`model: "haiku"` / `model: "sonnet"`)
3. Advisor consultations (implicitly `opus`)

When Anthropic adds a new model tier (e.g. `nano`, `flash`, `ultra`), the skill silently misses it. The names must be updated manually.

## Architecture

A single new step — **Step 0: Discover available models** — is inserted at the top of the master process, before decomposition. It produces three named tiers: `FAST`, `CAPABLE`, and `APEX`. All subsequent references to model names use these tier labels.

No changes to `executor.md` or `advisor.md`. Tier resolution is the master's responsibility.

## Step 0: Discover Available Models

> Inspect the `model` parameter enum on the `Agent` tool. You will see a list of values. Rank them into three tiers using your training knowledge:
>
> - **FAST** — fastest and cheapest: smallest context window, most limited reasoning
> - **CAPABLE** — balanced: good reasoning at moderate cost
> - **APEX** — most capable: strongest reasoning, highest cost
>
> **Unknown model heuristic:** If you encounter a model name you don't recognize, place it at **APEX**. Anthropic consistently introduces new names for more capable models — an unrecognized name is more likely a new capable model than a cheaper one.
>
> **Degraded enum fallback:**
> - Two values: map cheapest → FAST, most capable → APEX; skip CAPABLE (use FAST for mechanical, APEX for everything else)
> - One value: use it for all tiers

## Classification Table (updated)

| Subtask type | Tier |
|---|---|
| Mechanical: isolated change, 1-2 files, unambiguous spec | **FAST** |
| Complex: multi-file, integration concerns, judgment calls | **CAPABLE** |
| Advisory consultations | **APEX** |

## Executor Dispatch (updated)

Replace hardcoded model names in the executor spawn template:

```js
Agent({
  model: <value for FAST or CAPABLE tier from Step 0>,
  ...
})
```

Advisor consultations use the **APEX** tier value.

## Change Surface

| File | Change |
|---|---|
| `skills/advisor-hierarchy/SKILL.md` | Add Step 0; update classification table; update all model references |
| `skills/advisor-hierarchy/executor.md` | None |
| `skills/advisor-hierarchy/advisor.md` | None |

## Testing

No automated test exists for skill content. Validate by:
1. Invoking `/ah` on a real task in Claude Code
2. Confirming the master lists discovered tiers before dispatching
3. Confirming executors are spawned with the correct model values
4. (Optional) Temporarily add a fake model name to the enum and confirm it lands at APEX
