---
name: comments
description: How to decide whether a code comment is needed and how to write it. Loads when writing or editing code. Simple code gets no comment; comment only a non-obvious why, a trap, or a hidden coupling, in one or two short sentences.
paths:
  - "**/*.py"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.go"
  - "**/*.cs"
  - "**/*.java"
  - "**/*.kt"
  - "**/*.rs"
  - "**/*.rb"
  - "**/*.php"
  - "**/*.swift"
  - "**/*.c"
  - "**/*.h"
  - "**/*.cpp"
  - "**/*.sql"
  - "**/*.sh"
  - "**/*.ps1"
  - "**/*.lua"
  - "**/*.dart"
  - "**/*.scala"
---

# Comments

Clear code needs no comment. Before writing one, ask: can the code say this
instead? Rename, extract, or simplify first. If the comment still earns its
place, it is one of three kinds:

| Kind | It answers | Example |
|---|---|---|
| WHY | a reason or constraint the code cannot show | `// 300ms: the API rejects more than 3 calls per second.` |
| TRAP | an order that matters, a platform quirk, a workaround and its cause | `# Flush before fork: the child inherits the buffer.` |
| HIDDEN COUPLING | changing this breaks something elsewhere; name it | `-- Keep in sync with STATUS in api/status.go.` |

One or two short plain sentences. If the comment is harder to read than the
code, delete it.

## Banned

- Narration of what the lines do: `// loop over users and add to list`.
- History of how the code got here: `// changed from X`, `// previously`,
  `// fixed bug where`, `// now we`, `// new:`. That is the commit message.
- An issue number as the whole comment: `// #1234`, `// PROJ-12`.
  Say the why; the ticket may follow it.
- Commented-out code. Delete it. Git remembers.
- Docblocks that restate the signature: `/** Gets the user. @param id the id */`.

## Allowed and wanted

- Public API docs where the language's tooling reads them (docstrings,
  `///`, `/** */`), kept short: what it does, what it returns, what it
  raises. Nothing the signature already says.
- Licence headers.
- Tool directives with a reason: `# noqa: E501  URL cannot wrap`,
  `// eslint-disable-next-line no-console -- CLI entry point`.
- TODOs that name a concrete condition: `// TODO: drop when Node 18 is out of support.`

## Examples

Python
```python
# bad: narration and history
# loop over the orders and sum the totals
# previously used reduce
total = sum(o.total for o in orders)

# good: nothing. The line says it.
total = sum(o.total for o in orders)

# good: a trap
time.sleep(0.2)  # The API rate-limits bursts under 200ms apart.
```

TypeScript
```ts
// bad: restates the signature
/** Parses a date string and returns a Date. @param s the string */
export function parseDate(s: string): Date {

// good: a trap
export function parseDate(s: string): Date {
  // Safari rejects "YYYY-MM-DD HH:mm"; the T separator is required.
  return new Date(s.replace(" ", "T"));
}
```

C#
```cs
// bad: history
// Fixed bug where the token was refreshed twice. Now we check expiry first.
if (_cache.TryGet(out var t) && !Expired(t)) return t;

// good: nothing. The condition says it.
if (_cache.TryGet(out var t) && !Expired(t)) return t;

// good: a why
using var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
// Windows keeps the lock until dispose; readers in other processes need Read share.
```

Go
```go
// bad: narration
// open the file with the flags
f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_SYNC, 0o600)

// good: a why
// O_SYNC: the WAL relies on each write hitting disk before the ack.
f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_SYNC, 0o600)
```

SQL
```sql
-- bad: commented-out code and a bare ticket
-- SELECT count(*) FROM orders WHERE status IS NULL;
-- PROJ-881
CREATE INDEX idx_orders_status ON orders(status) WHERE status IS NOT NULL;

-- good: a why
-- Partial index: 90% of rows have status NULL and are never queried.
CREATE INDEX idx_orders_status ON orders(status) WHERE status IS NOT NULL;
```

## When reviewing

A narrative comment is a WARNING, never a blocker. Put all of them in one
finding, raised once per branch, and never raise it again in a later round,
fixed or not. Never flag a comment the change did not touch.
