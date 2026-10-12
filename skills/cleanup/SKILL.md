---
name: cleanup
description: Clean the comments in a diff range or path. Deletes narration, history and commented-out code, shortens the rest, keeps every why, trap and coupling. Never changes code behaviour. Use when asked to clean, trim or fix comments.
argument-hint: "[range | path ...]"
allowed-tools: Bash(git diff *), Bash(git status *), Bash(python3 *), Bash(python *)
---

# Cleanup

Scope: `$ARGUMENTS`. A git range (`main..HEAD`) means only the comments the
range ADDED. A path means every comment in those files. With no argument,
use the working tree and staged changes (`git diff HEAD`); if that is empty,
ask which files.

## Steps

1. Mechanical pass first. Run
   `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/check_comments.py" --diff-file -`
   with the diff on stdin (or `python` if `python3` is missing). For a path,
   run it with `--diff-file` on a diff you build from the whole file, or just
   read the file: the script only knows diffs.
2. Read each comment in scope and sort it into one bucket:
   - **delete**: narration of what the code does, history (`previously`,
     `changed from`, `fixed`, `now we`, `new:`), commented-out code, a bare
     issue ref, a docblock that only restates the signature.
   - **shorten**: it holds a real why, trap or coupling but takes more than
     two sentences or wraps it in filler. Rewrite to one or two plain sentences.
   - **keep**: a why, a trap, a hidden coupling, a licence header, a tool
     directive with a reason, a TODO with a concrete condition, a short API doc.
   - **unsure**: you cannot tell whether it hides a why. Do not touch it.
3. Apply only the delete and shorten buckets. Edit comment text only.
   Never touch a code token, a string, or a blank line that separates code.
   When a deleted comment leaves an empty line that was not there before,
   remove it.
4. Verify: `git diff -U0` the files you touched. Every removed line and every
   added line must be a comment line. If any code line changed, revert that
   hunk.
5. Report in this shape:

```
cleanup: N deleted, M shortened, K kept, U unsure
unsure (left as is):
- path:line  "<comment>"  because <one clause>
```
