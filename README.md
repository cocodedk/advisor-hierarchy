# advisor-hierarchy

A 3-tier Claude Code skill set that mirrors the [Anthropic Advisor Tool API](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool) pattern inside Claude Code.

**Master** (your session) orchestrates → **Sonnet/Haiku executors** do the work → **Opus advisors** provide strategic guidance on demand.

Built by [Babak Bandpey](https://www.linkedin.com/in/babakbandpey) at [cocode.dk](https://cocode.dk).

## Install

```bash
git clone https://github.com/cocodedk/advisor-hierarchy.git ~/projects/advisor-hierarchy
cd ~/projects/advisor-hierarchy
bash install.sh
```

## Usage

```
/ah "your task here"
```

Example:

```
/ah "refactor the auth module to use JWT"
```

## How it works

1. You invoke `/ah` with a task description
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

## Why this pattern?

The native [Anthropic Advisor Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool) achieves near-Opus quality at lower cost by using cheap models for execution and Opus only for strategic advice. This skill set replicates that pattern inside Claude Code using the Agent tool — no API changes required.

Benchmarks from the native tool:
- Sonnet + Opus advisor: +2.7pp on SWE-bench Multilingual, 11.9% cost reduction
- Haiku + Opus advisor: 2× score improvement on BrowseComp, 85% cheaper than Sonnet alone

## Uninstall

```bash
rm -rf ~/.claude/skills/advisor-hierarchy
rm -f ~/.claude/commands/ah.md
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
