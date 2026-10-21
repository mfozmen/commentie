# commentie

A Claude Code and OpenCode plugin that keeps code comments few, short and
plain.

AI-written code fills with narrative comments, and reviews then loop on fixing
prose. commentie teaches the rule while code is written, cleans up on demand,
and guards cheaply: a stdlib script first, a Haiku critic second, and the
critic warns once per branch and never blocks.

Claude Code:

```
/plugin marketplace add mfozmen/devkit
/plugin install commentie@devkit
```

OpenCode, once published to npm:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["commentie"]
}
```

See [OpenCode](#opencode) for local checkouts and options.

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

The names above are Claude Code's; the [OpenCode](#opencode) section maps them
one to one.

## The script

```
python scripts/check_comments.py                 # staged changes
python scripts/check_comments.py main..HEAD      # a range
python scripts/check_comments.py --file src/a.py # one file against HEAD
python scripts/check_comments.py --strict ...    # exit 1 on findings
python scripts/check_comments.py --self-test
```

Output is `file:line: reason`. Exit code is 0 unless `--strict`.
Skip patterns with a `.commentie-allow` file at the repo root, one regex per
line. Change the long-block threshold with `--max-block N` (default 5).

## The hook (Claude Code)

Off by default. Turn it on with `/plugin configure commentie@devkit` and enable
"Check comments after each edit", or at install time with
`claude plugin install commentie@devkit --config hook_enabled=true`.

## OpenCode

The plugin registers itself and needs no files copied into the project. For a
local checkout, point the config at the repo directory:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///absolute/path/to/commentie"]
}
```

Everything maps one to one:

| Claude Code | OpenCode |
|---|---|
| skill `comments`, loaded with code files | the same rule, injected into the system prompt |
| `/commentie:cleanup [range \| path]` | `/commentie-cleanup [range \| path]` |
| `/commentie:install` | `/commentie-install` |
| agent `commentie:comment-critic` | subagent `comment-critic` |
| hook after Edit and Write | hook after edit, write and apply_patch, off by default |

Options go in the second element of the plugin entry:

```json
{
  "plugin": [["file:///absolute/path/to/commentie", { "hook": true }]]
}
```

- `hook` (default `false`): append findings to the tool result after an edit.
  `COMMENTIE_HOOK=true` enables it too.
- `criticModel`: pin the critic to a model, for example
  `"anthropic/claude-haiku-4-5"`. Without it the critic uses your default
  model.

The hook finds `python3` or `python` on `PATH`; the script is the same one
described below.

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

## Releasing

Releases are cut by [release-please](https://github.com/googleapis/release-please)
from [Conventional Commits](https://www.conventionalcommits.org/). PRs are
squash-merged, so the PR title is the commit: `feat: ...` bumps the minor
version, `fix: ...` the patch, `feat!: ...` or a `BREAKING CHANGE:` footer the
minor while below 1.0. `docs`, `ci`, `chore`, `test` and `refactor` release
nothing on their own. After each merge to `main`, release-please updates a
release PR that bumps `.claude-plugin/plugin.json`, `package.json` and
`CHANGELOG.md`; merging it tags `vX.Y.Z` and publishes the GitHub release.
Publishing the same version to npm with `npm publish` makes
`"plugin": ["commentie"]` work for OpenCode; a local path works without it.

## Licence

MIT
