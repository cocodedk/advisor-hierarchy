# advisor-hierarchy

A 3-tier Claude Code skill set that mirrors the [Anthropic Advisor Tool API](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool) pattern inside Claude Code.

**Master** (your session) orchestrates → **Sonnet/Haiku executors** do the work → **Opus advisors** provide strategic guidance on demand.

Built by [Babak Bandpey](https://www.linkedin.com/in/babakbandpey) at [cocode.dk](https://cocode.dk).

## Website

- [cocodedk.github.io/advisor-hierarchy](https://cocodedk.github.io/advisor-hierarchy/)

## Install

```bash
npx ah
```

That's it. Works on Mac, Linux, and Windows. Running it again updates to the latest version.

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

## Benchmark

We tested `/ah` against a direct Claude Code build by giving both the same task: build a Breakout game with neon graphics and animations as a single HTML file.

Same spec. Same model family. Different approach.

| Dimension | Direct | /ah | Winner |
|---|---|---|---|
| Visual quality | 4/5 | 4/5 | Tie |
| Code quality | 4/5 | 5/5 | /ah |
| Feature completeness | 11/11 | 11/11 | Tie |
| **Total** | **19/21** | **20/21** | **/ah** |

**The difference:** `/ah` decomposed the task into two sequential passes — a Sonnet executor for game mechanics, then a Sonnet executor for visual polish. The forced separation produced measurably cleaner code: a `createState()` factory for restarts, proper mouse-position scaling, keyboard-layout-agnostic input, and tighter physics normalization.

**The cost:** ~59,460 tokens across two agent round-trips vs. a single direct pass. No Opus advisor calls were needed — both tasks were well-specified enough that executors didn't need strategic guidance.

**When `/ah` justifies its overhead:** Tasks where code architecture matters — multi-file work, long-lived code, anything that needs to be maintained. The decomposition forces separation of concerns that a single-pass build tends to skip under pressure.

**When it doesn't:** Throwaway scripts, visuals-only work, or tightly-scoped tasks where the spec is already precise.

See [`benchmark/results.md`](benchmark/results.md) for the full scored report.

## Uninstall

```bash
npx ah uninstall
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
