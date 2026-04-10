# Advisor Hierarchy Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 3-tier Claude Code skill set where a master session orchestrates Haiku/Sonnet executor agents, which consult Opus advisor agents on demand.

**Architecture:** Three Markdown skill files (`SKILL.md`, `executor.md`, `advisor.md`) stored in `~/.claude/skills/advisor-hierarchy/`. Each tier self-configures by invoking its own skill. The master is the current session; executors and advisors are spawned agents. Explicit activation via `/advisor-hierarchy` slash command.

**Tech Stack:** Claude Code skills (Markdown + YAML frontmatter), Bash (install script)

---

## File Map

| File | Role |
|---|---|
| `skills/advisor-hierarchy/advisor.md` | Constrains Opus to advice-only mode |
| `skills/advisor-hierarchy/executor.md` | Governs Haiku/Sonnet execution and advisor consultation |
| `skills/advisor-hierarchy/SKILL.md` | Master entry point — decompose, delegate, synthesize |
| `install.sh` | Symlinks or copies skills to `~/.claude/skills/` |
| `README.md` | Usage docs |

---

### Task 1: Create `advisor.md`

The most constrained tier. Opus reads context, returns a short plan, calls no tools, produces no user output.

**Files:**
- Create: `skills/advisor-hierarchy/advisor.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: advisor-hierarchy:advisor
description: Loaded by Opus advisor agents in the advisor hierarchy. Constrains Opus to advice-only mode — no tools, no user output, plan text only.
---

# Advisor Role

You are an advisor in a 3-tier agent hierarchy. An executor agent spawned you because it needs strategic guidance. Your role is strictly advisory — you plan, you do not act.

## Rules

1. **Read the full context** passed to you by the executor
2. **Return a plan** — plain text, under 150 words, enumerated steps only
3. **No tool calls** — do not read files, run bash, search, or use any tool
4. **No user-facing output** — the executor is your only audience; do not address the user
5. **No execution language** — never say "I'll do X" or "I will X", only "you should do X" or "do X"
6. **Stop signal** — if the task is fundamentally broken, impossible, or out of scope, begin your entire response with `STOP:` and explain why in one sentence so the executor can escalate

## Output format

Respond with numbered steps only. No preamble, no greeting, no sign-off.

Example:

1. Extract the token from the Authorization header using `req.headers.authorization.split(' ')[1]`
2. Verify with `jwt.verify(token, process.env.JWT_SECRET)` — wrap in try/catch
3. Attach decoded payload to `req.user` before calling `next()`
4. Return 401 with `{ error: 'Unauthorized' }` in the catch block

Maximum 150 words total. If you cannot fit the plan in 150 words, the plan is too broad — pick the most critical decision and address that only.
```

- [ ] **Step 2: Validate YAML frontmatter**

```bash
cd ~/projects/advisor-hierarchy
python3 -c "
import sys
content = open('skills/advisor-hierarchy/advisor.md').read()
assert content.startswith('---'), 'Missing opening ---'
end = content.index('---', 3)
import yaml
meta = yaml.safe_load(content[3:end])
assert 'name' in meta, 'Missing name'
assert 'description' in meta, 'Missing description'
print('OK:', meta['name'])
"
```

Expected: `OK: advisor-hierarchy:advisor`

- [ ] **Step 3: Commit**

```bash
cd ~/projects/advisor-hierarchy
git add skills/advisor-hierarchy/advisor.md
git commit -m "feat: add advisor skill (Opus advice-only tier)"
```

---

### Task 2: Create `executor.md`

The execution tier. Haiku or Sonnet receives a subtask, executes it, consults Opus advisor at most 3 times, reports status.

**Files:**
- Create: `skills/advisor-hierarchy/executor.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: advisor-hierarchy:executor
description: Loaded by Haiku/Sonnet executor agents in the advisor hierarchy. Governs execution, advisor consultation timing, and status reporting.
---

# Executor Role

You are an executor in a 3-tier agent hierarchy. The master agent spawned you with a specific subtask. Execute it completely, consult the Opus advisor when you genuinely need strategic guidance, and report your final status.

## Rules

1. **Read your task fully before starting.** If anything critical is unclear, report `NEEDS_CONTEXT` immediately — do not guess or proceed on assumptions.
2. **Execute end-to-end:** write code, run tests, iterate until done or blocked.
3. **Do not exceed your task scope.** Do not refactor, rename, or modify files outside your task boundaries.
4. **Consult the Opus advisor at these moments — and only these:**
   - Before committing to a non-trivial architectural decision (e.g., data structure choice, API design)
   - When stuck: same error appearing 2+ times, or your approach is not converging
   - When you believe the task is complete on a complex task — before reporting DONE
5. **Cap advisor consultations at 3 per task.** After 3 advisor calls, if still stuck, report BLOCKED.
6. **Follow advisor guidance** unless you have direct contradicting evidence (e.g., the file says X, advisor says Y). In that case, make one more advisor call: "I found X in the file, you suggested Y — which applies here?"
7. **Never call the advisor for trivial questions** you can answer by reading the code or running a command.

## How to consult the Opus advisor

Spawn an Opus sub-agent with exactly this structure:

```
Agent({
  model: "opus",
  description: "Opus advisor consultation",
  prompt: `You are an advisor. Your first action is to invoke the \`advisor-hierarchy:advisor\` skill.

## Task context
[paste your full subtask description here]

## What I have done so far
[describe your current state: what you tried, what you read, what failed]

## The decision or problem I need guidance on
[one specific question — not "what should I do?" but "should I use X or Y because Z?"]`
})
```

Wait for the advisor's response before continuing.

## Status reporting

When done, output exactly one of these status lines as your final output:

- `DONE` — task complete, all tests pass, nothing left
- `DONE_WITH_CONCERNS: [description]` — complete but flagging a doubt or risk
- `NEEDS_CONTEXT: [what is missing]` — cannot proceed without specific information
- `BLOCKED: [description of blocker after 3 advisor calls]` — genuinely stuck
```

- [ ] **Step 2: Validate YAML frontmatter**

```bash
cd ~/projects/advisor-hierarchy
python3 -c "
content = open('skills/advisor-hierarchy/executor.md').read()
assert content.startswith('---'), 'Missing opening ---'
end = content.index('---', 3)
import yaml
meta = yaml.safe_load(content[3:end])
assert 'name' in meta, 'Missing name'
assert 'description' in meta, 'Missing description'
print('OK:', meta['name'])
"
```

Expected: `OK: advisor-hierarchy:executor`

- [ ] **Step 3: Commit**

```bash
cd ~/projects/advisor-hierarchy
git add skills/advisor-hierarchy/executor.md
git commit -m "feat: add executor skill (Haiku/Sonnet execution tier)"
```

---

### Task 3: Create `SKILL.md` (master)

The entry point. Activated by `/advisor-hierarchy`. Decomposes the task, classifies subtasks, spawns executors, handles results, synthesizes output. Never executes itself.

**Files:**
- Create: `skills/advisor-hierarchy/SKILL.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: advisor-hierarchy
description: Use when executing a complex multi-step task using a 3-tier agent hierarchy. Master orchestrates, Sonnet/Haiku execute, Opus advises on demand. Explicit invocation only — do NOT auto-trigger.
---

# Advisor Hierarchy — Master

You are the master in a 3-tier agent hierarchy. You decompose tasks, delegate to executor agents, and synthesize results. **You never execute tasks yourself — not even "quick" ones.**

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
- Do not refactor code outside your task boundaries
- Report your status when done: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`
})
```

**Never tell the executor to read files itself.** Paste the content directly. This avoids round-trips and ensures the executor has exactly the context it needs.

### 5. Handle executor results

| Status | Your action |
|---|---|
| `DONE` | Mark subtask complete, proceed |
| `DONE_WITH_CONCERNS: [x]` | Read the concern. If it affects correctness or scope, address it before proceeding. If it is an observation (e.g., "this file is getting large"), note it and proceed. |
| `NEEDS_CONTEXT: [x]` | Provide exactly what is missing. Re-dispatch the same model. |
| `BLOCKED` (1st time) | If executor was Haiku, re-dispatch as Sonnet with the same task + what was tried. If executor was Sonnet, re-dispatch Sonnet with more context and a specific prompt about the blocker. |
| `BLOCKED` (2nd time) | Escalate to the user: summarise the task, what was tried, and what is stuck. Do not re-dispatch. |

### 6. Synthesize

When all subtasks are complete, report to the user:
- What was done (one line per subtask)
- Any concerns flagged by executors
- Any files created or modified
- Next steps if relevant

## Rules

- **Never execute** code, write files, call tools, or implement anything yourself
- **Provide complete context** to each executor — they have no memory of this session
- **Do not skip classification** — every subtask must be explicitly assigned Haiku or Sonnet
- **Parallel dispatch only for truly independent subtasks** — when in doubt, sequential is safer
```

- [ ] **Step 2: Validate YAML frontmatter**

```bash
cd ~/projects/advisor-hierarchy
python3 -c "
content = open('skills/advisor-hierarchy/SKILL.md').read()
assert content.startswith('---'), 'Missing opening ---'
end = content.index('---', 3)
import yaml
meta = yaml.safe_load(content[3:end])
assert 'name' in meta
assert 'description' in meta
print('OK:', meta['name'])
"
```

Expected: `OK: advisor-hierarchy`

- [ ] **Step 3: Commit**

```bash
cd ~/projects/advisor-hierarchy
git add skills/advisor-hierarchy/SKILL.md
git commit -m "feat: add master skill (entry point, orchestration rules)"
```

---

### Task 4: Create `install.sh` and `README.md`

**Files:**
- Create: `install.sh`
- Create: `README.md`

- [ ] **Step 1: Create install.sh**

```bash
#!/usr/bin/env bash
set -e

SKILL_SRC="$(cd "$(dirname "$0")/skills/advisor-hierarchy" && pwd)"
SKILL_DST="$HOME/.claude/skills/advisor-hierarchy"

if [ -e "$SKILL_DST" ]; then
  echo "Already installed at $SKILL_DST"
  echo "To reinstall: rm -rf $SKILL_DST && bash install.sh"
  exit 0
fi

# Try symlink first
ln -s "$SKILL_SRC" "$SKILL_DST" 2>/dev/null && {
  echo "Installed via symlink: $SKILL_DST -> $SKILL_SRC"
  exit 0
}

# Fallback to copy
cp -r "$SKILL_SRC" "$SKILL_DST"
echo "Installed via copy: $SKILL_DST"
```

- [ ] **Step 2: Make install.sh executable**

```bash
chmod +x ~/projects/advisor-hierarchy/install.sh
```

- [ ] **Step 3: Create README.md**

```markdown
# advisor-hierarchy

A 3-tier Claude Code skill set that mirrors the [Anthropic Advisor Tool API](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool) pattern inside Claude Code.

**Master** (your session) orchestrates → **Sonnet/Haiku executors** do the work → **Opus advisors** provide strategic guidance on demand.

## Install

```bash
git clone https://github.com/cocodedk/advisor-hierarchy.git ~/projects/advisor-hierarchy
cd ~/projects/advisor-hierarchy
bash install.sh
```

## Usage

```
/advisor-hierarchy "your task here"
```

Example:

```
/advisor-hierarchy "refactor the auth module to use JWT"
```

## How it works

1. You invoke `/advisor-hierarchy` with a task
2. The master skill loads — your session becomes the master
3. Master decomposes the task, classifies subtasks (Haiku for mechanical, Sonnet for complex)
4. Master spawns executor agents — each loads `advisor-hierarchy:executor`
5. Executors work end-to-end; when stuck or at a key decision, they spawn an Opus advisor
6. Opus advisors load `advisor-hierarchy:advisor` — they advise only, never execute
7. Executors report back; master synthesizes and reports to you

## Skills

| Skill | Model | Role |
|---|---|---|
| `advisor-hierarchy` | Session (Sonnet) | Master: decompose, delegate, synthesize |
| `advisor-hierarchy:executor` | Haiku or Sonnet | Execute tasks, consult Opus ≤3x |
| `advisor-hierarchy:advisor` | Opus | Advise only — no tools, no execution |

## Uninstall

```bash
rm ~/.claude/skills/advisor-hierarchy
```

## License

MIT
```

- [ ] **Step 4: Commit**

```bash
cd ~/projects/advisor-hierarchy
git add install.sh README.md
git commit -m "feat: add install script and README"
```

---

### Task 5: Install and smoke test

Verify the skill loads correctly in Claude Code before calling it done.

**Files:**
- No new files — this task is verification only

- [ ] **Step 1: Run install script**

```bash
cd ~/projects/advisor-hierarchy
bash install.sh
```

Expected output (symlink case):
```
Installed via symlink: /home/<user>/.claude/skills/advisor-hierarchy -> /home/<user>/projects/advisor-hierarchy/skills/advisor-hierarchy
```

- [ ] **Step 2: Verify symlink or copy is in place**

```bash
ls -la ~/.claude/skills/advisor-hierarchy/
```

Expected: lists `SKILL.md`, `executor.md`, `advisor.md`

- [ ] **Step 3: Verify all three skill files are readable**

```bash
python3 -c "
import yaml, os
base = os.path.expanduser('~/.claude/skills/advisor-hierarchy')
for fname in ['SKILL.md', 'executor.md', 'advisor.md']:
    content = open(f'{base}/{fname}').read()
    end = content.index('---', 3)
    meta = yaml.safe_load(content[3:end])
    print(f'OK {fname}: name={meta[\"name\"]}')
"
```

Expected:
```
OK SKILL.md: name=advisor-hierarchy
OK executor.md: name=advisor-hierarchy:executor
OK advisor.md: name=advisor-hierarchy:advisor
```

- [ ] **Step 4: Smoke test — invoke the master skill**

In Claude Code, type:
```
/advisor-hierarchy "create a hello world Python script at ~/tmp/hello.py"
```

Expected behaviour:
- Master skill loads and announces itself
- Master classifies the task as mechanical → Haiku
- Master spawns a Haiku executor with task context
- Executor loads `advisor-hierarchy:executor` skill
- Executor creates the file (no advisor needed for this task)
- Executor reports DONE
- Master reports completion to you

Verify:
```bash
cat ~/tmp/hello.py
```

Expected: a working hello world Python script.

- [ ] **Step 5: Final commit**

```bash
cd ~/projects/advisor-hierarchy
git add -A
git status   # should be clean — nothing unstaged
```

Expected: `nothing to commit, working tree clean`

---

## Post-implementation

Once all tasks pass, push to GitHub:

```bash
cd ~/projects/advisor-hierarchy
gh repo create cocodedk/advisor-hierarchy --public --source=. --remote=origin --push
```

This creates a new public repo `cocodedk/advisor-hierarchy` and pushes all commits.
