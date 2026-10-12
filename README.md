# commentie

A Claude Code plugin that keeps code comments few, short and plain.

AI-written code fills with narrative comments, and reviews then loop on fixing
prose. commentie teaches the rule while code is written, cleans up on demand,
and guards cheaply: a stdlib script first, a Haiku critic second, and the
critic warns once per branch and never blocks.

```
/plugin marketplace add mfozmen/devkit
/plugin install commentie@devkit
```

## The rule

Clear code needs no comment. Comment only what the code cannot say: a
non-obvious **why**, a **trap**, or a **hidden coupling**. One or two short
sentences. Banned: narration, history, bare issue refs, commented-out code,
docblocks that restate the signature.

## What you get

| Piece | What it does |
|---|---|
| skill `comments` | The rule with examples in Python, TypeScript, C#, Go and SQL. Loads when Claude edits code. |
| `/commentie:cleanup [range \| path]` | Deletes narration and history, shortens the rest, keeps every why, trap and coupling. Never touches code. Lists what it was unsure about instead of deleting it. |
| agent `commentie:comment-critic` | Read-only review of the comments a diff range added, on Haiku. One WARNING finding, raised once per branch. |
| `scripts/check_comments.py` | Stdlib, no dependencies. Flags history words, bare issue refs, commented-out code and long blocks in the added lines of a diff. |
| hook (off by default) | Runs the script after every Edit or Write and shows findings to Claude. Never blocks. |
| `/commentie:install` | Adds the rule to CLAUDE.md or AGENTS.md and offers pre-commit or CI wiring. Asks before every change. |

## The script

```
python scripts/check_comments.py                 # staged changes
python scripts/check_comments.py main..HEAD      # a range
python scripts/check_comments.py --strict ...    # exit 1 on findings
python scripts/check_comments.py --self-test
```

Output is `file:line: reason`. Exit code is 0 unless `--strict`.
Skip patterns with a `.commentie-allow` file at the repo root, one regex per
line. Change the long-block threshold with `--max-block N` (default 5).

## The hook

Off by default. Turn it on with `/plugin configure commentie@devkit` and enable
"Check comments after each edit", or at install time with
`claude plugin install commentie@devkit --config hook_enabled=true`.

## Evals

```
python scripts/check_comments.py --self-test
python evals/run_evals.py
```

`evals/fixtures` holds diffs labelled narrative or useful, with the expected
script findings and critic verdict in `evals/expected.json`. The useful set is
real why, trap and coupling comments the script must not flag. Critic verdicts
are checked by running `@agent-commentie:comment-critic` on a fixture applied
to a scratch repo.

## Licence

MIT
