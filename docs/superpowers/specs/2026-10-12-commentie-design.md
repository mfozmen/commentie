# commentie design

A Claude Code plugin that keeps code comments few, short and plain.
Problem: AI-written code fills with narrative comments, and reviews then
loop on fixing prose.

## The rule

Clear code needs no comment. Comment only what the code cannot say:

- a non-obvious WHY (a reason or a constraint),
- a TRAP (an order that matters, a platform quirk, a workaround and its cause),
- a HIDDEN COUPLING (changing this breaks something elsewhere; name it).

One or two short plain sentences. If the comment is harder to read than
the code, delete it.

Banned: narration of what the lines do; history of how the code got here
(that is the commit message); issue refs as the whole content; commented-out
code; docblocks that restate the signature.

Allowed: short public API docs where the language's tooling uses them,
licence headers, tool directives with a reason, TODOs naming a concrete
condition.

## The review lesson

Reviewers treat a narrative comment as a WARNING, never a blocker. All such
comments go into ONE finding, raised ONCE per branch: never again in a later
round, fixed or not, and never on a comment the change did not touch.

## Principles

- Skills are knowledge, agents are roles, deterministic checks are scripts.
- A script beats prose wherever a pattern is mechanical.
- No model call in the hot path unless needed.
- Language-agnostic; comment syntax detected per file type.

## Components

| Path | Role |
|---|---|
| `skills/comments/SKILL.md` | The rule with examples in 5 languages. `paths` globs make it load when editing code. |
| `skills/cleanup/SKILL.md` | `/commentie:cleanup <range|path>`: delete narration and history, shorten the rest, keep why/trap/coupling. Never changes code. Lists unsure comments instead of deleting. |
| `skills/install/SKILL.md` | `/commentie:install`: adds a rule section to CLAUDE.md or AGENTS.md; offers pre-commit or CI wiring. Asks before every change. Manual only. |
| `agents/comment-critic.md` | Read-only diff reviewer on `claude-haiku-5-5`. Warning-only, one finding, once per branch. |
| `scripts/check_comments.py` | Stdlib. Added diff lines only. Flags history words, bare issue refs, commented-out code, long blocks. `file:line:reason`. Exit 0, or 1 with `--strict`. Allowlist file. `--self-test`. |
| `hooks/hooks.json` | PostToolUse on Edit/Write. Runs the script in `--hook` mode, returns findings as `additionalContext`. Never blocks. |
| `evals/` | Diff fixtures labelled narrative or useful, expected script findings and critic verdicts, `run_evals.py` reporting precision and recall. |

## Decisions

- **Hook off by default.** Plugins have no per-hook toggle. `userConfig.hook_enabled`
  (boolean, default false) is exported to the hook process as
  `CLAUDE_PLUGIN_OPTION_HOOK_ENABLED`; the script exits at once unless it is `true`.
- **Once per branch.** The critic writes `.git/commentie/<branch>` with the
  `file:line` list it flagged. Later rounds skip those. Only added lines in the
  diff range are considered, so untouched comments are never flagged.
- **Hook file scope.** In `--hook` mode the script diffs the touched file against
  HEAD (whole file if untracked), so only new comments are reported.
- **Interpreter.** Shell-form hook: `python3 ... || python ...`, so it runs on
  Linux, macOS and Windows Git Bash without a wrapper.

## Out of scope

Release tooling, changelog, SonarCloud, `claude plugin eval` suite. The critic's
verdicts are checked once in the live demo, not in CI.
