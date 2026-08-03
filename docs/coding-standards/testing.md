# Testing

Vitest. `npm test` runs everything; `npm run test:watch` while working.

## What gets a test

**Pure logic, always.** Extract the decision from the I/O and test the
decision. `documentsNeedingPublish`, `takeWithinBudget`, `reconcilePlan`,
`extractVersionNotes` — all pure, all tested, all previously bugs waiting to
happen.

**Anything that lost data once, forever.** The store integrity check, the seed
idempotency rules, the memory-sync budget. Regression tests are cheap; the
bugs they prevent were not.

**Discord glue, lightly.** Mock the minimum surface. `send.test.ts` builds a
five-line fake Guild rather than importing discord.js machinery.

## What a good test looks like

Name the behaviour, not the function:

```ts
it('does not resurrect a fact a moderator deleted', ...)
it('keeps the MOST RECENT items, not the oldest', ...)
it('treats an already-deleted message as normal, not an error', ...)
```

Each of those names a real failure mode. `it('works')` names nothing.

## Assert the reason, not just the result

Where a test exists to prevent a specific mistake, say so in a comment:

```ts
// The bug this replaced kept the head and then deleted everything, so the
// newest conversations were discarded unread.
expect(takeWithinBudget(['old', 'mid', 'new'], 8)).toEqual(['mid', 'new']);
```

## Test the constraints, not only the happy path

`documents.test.ts` asserts the terms never mention a vendor name — so
switching LLM provider can never silently make a published document wrong.
That is a policy encoded as a test, and it is the most valuable one in the file.

## Before every commit

```
npm run typecheck && npm test && npm run lint
```

All three. Lint catches unused imports that typecheck allows.
