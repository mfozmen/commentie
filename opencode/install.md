# Install commentie into this project

Ask before every change, one question at a time. Show the exact text or diff
first.

## 1. Project rule

Find `AGENTS.md` or `CLAUDE.md` at the project root. OpenCode uses the first
it finds, `AGENTS.md` before `CLAUDE.md`, so prefer `AGENTS.md` when both
exist. If neither exists, ask which to create. Skip this step when the file
already contains a `## Comments` heading.

Propose appending:

```md
## Comments

Follow the commentie rule. Clear code needs no comment. Comment only a
non-obvious why, a trap, or a hidden coupling, in one or two short sentences.
No narration, no history, no commented-out code, no bare issue refs.
Reviewers: a narrative comment is a warning, reported once per branch, never a blocker.
```

## 2. Script wiring (optional)

Before asking, tell the user what the script is, in two or three lines:
`check_comments.py` is a regex check, not a model. It reads only the added
lines of a diff and flags history words, bare issue refs, commented-out code
and long blocks. It costs no tokens, finishes in under a second, gives the
same result every run, and covers commits from people who do not use OpenCode.
With `--strict` it can fail the commit or the job, which an AI review usually
cannot. It is worth adding when the project has no AI review, wants a hard
gate, or already uses pre-commit. If CI already runs an AI review that reads
the comments rule and warnings are enough, say the script is optional and
skipping it is fine.

The plugin path changes on every update, so a pre-commit hook or CI step
should not point into it. Offer to copy
`${CLAUDE_PLUGIN_ROOT}/scripts/check_comments.py` to `scripts/check_comments.py`
in the project (one stdlib file, no dependencies). Only then offer, each as its
own question:

- **pre-commit**: if `.pre-commit-config.yaml` exists, add
  ```yaml
  - repo: local
    hooks:
      - id: commentie
        name: commentie
        entry: python scripts/check_comments.py --staged
        language: system
        pass_filenames: false
  ```
  If `package.json` has husky or lint-staged, add
  `python scripts/check_comments.py --staged` to the pre-commit script.
  Otherwise offer a plain `.git/hooks/pre-commit` and say it is local only.
- **CI**: if `.github/workflows/` exists, add a step to the main workflow:
  ```yaml
  - run: python scripts/check_comments.py origin/${{ github.base_ref || 'main' }}..HEAD
  ```
  with `fetch-depth: 0` on the checkout.

Default to warning-only (no `--strict`). Mention `--strict` once as the
opt-in that fails the commit or the job.

## 3. Hook

Say in one line: the after-edit check is off. Enable it by adding
`{ "hook": true }` next to the plugin entry in `opencode.json`:

```json
{ "plugin": [["commentie", { "hook": true }]] }
```

For a local checkout, wrap the path instead of the package name:

```json
{ "plugin": [["/path/to/commentie", { "hook": true }]] }
```

Restart OpenCode after the change.

Finish with a two-line summary of what changed.
