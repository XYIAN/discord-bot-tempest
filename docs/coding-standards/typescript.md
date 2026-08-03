# TypeScript

## Compiler settings are not negotiable

`strict: true` and `noUncheckedIndexedAccess` are on. The second one is the
unusual choice and it is deliberate: `items[i]` has type `T | undefined`,
because that is the truth. It caught a real bug in `takeWithinBudget` during
review — the loop indexed an array and TypeScript refused until the undefined
case was handled.

## No `any`

Use `unknown` at the boundary and narrow explicitly. Everything crossing into
the process — LLM responses, Discord payloads, JSON off disk — is `unknown`
until proven otherwise.

```ts
// parseCandidates in memory-sync.ts — the shape of an LLM reply is a promise,
// not a guarantee.
const parsed = JSON.parse(jsonMatch[0]) as unknown;
if (!Array.isArray(parsed)) return [];
return parsed.filter(
  (item): item is { text: string; category: string } =>
    typeof item === 'object' && item !== null &&
    typeof (item as { text?: unknown }).text === 'string',
);
```

A type predicate (`item is X`) is how you narrow. A cast (`as X`) is how you
lie. Prefer the first.

## Prefer unions to optional soup

Three optional fields that are only ever set together should be one union
member. If two states cannot coexist, make them impossible to express.

## Exported types live next to what they describe

`ChatTurn` and `LlmClient` live in `lib/llm/types.ts` and are re-exported from
`lib/llm/index.ts`. Consumers import from the folder, not the internal file, so
internals can move without touching call sites.

## Errors

Never `catch {}`. Either handle it, log it with context, or let it propagate:

```ts
// Expected — someone deleted the message by hand. Not an error.
if ((error as { code?: number }).code === UNKNOWN_MESSAGE) {
  logger.info(`Previous message ${messageId} was already deleted`);
  return false;
}
logger.warn(`Could not delete message ${messageId}`, error);
```

Independent steps get independent try/catches. A failed DM must not stop a
public announcement — that rule is in `CLAUDE.md` because it was violated once
and members lost their welcome post.
