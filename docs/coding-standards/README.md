# Coding standards

How we build Tempest Bot. These are written down because the sibling bot
(`discord-bot`, Archero 2) grew organically in plain JavaScript, and the cost
showed up later: a wiped contribution ledger nobody noticed for months, silent
role-grant failures, and stale docs describing a bot that had changed. Every
rule here exists because something went wrong without it.

Read [naming.md](naming.md), [typescript.md](typescript.md),
[testing.md](testing.md) and [deploys.md](deploys.md) for the detail.

## The short version

1. **TypeScript, strict, no `any`.** Types are the point. If a type is hard to
   express, that usually means the design is wrong, not that the type should
   be loosened.
2. **Features are the unit.** Each folder in `src/features/` exports a
   `FeatureModule`. Features never import each other — shared behaviour lives
   in `src/lib/`.
3. **No hardcoded snowflakes or role-name strings** in feature code. Channels,
   roles, tiers and identity live in `src/config/guild.ts`; env is parsed once
   in `src/config/env.ts`. Read `ctx.config`, never `process.env`.
4. **Anything that matters is persisted** through `ctx.stores.store<T>()`.
   Redeploys are frequent; module-level state is lost. In-memory is fine only
   for throwaway rate limits.
5. **Pure logic is extracted and unit-tested.** Discord I/O is thin glue around
   a tested pure core. Run `npm run typecheck && npm test && npm run lint`
   before every commit.
6. **Content that is published lives in the repo**, not typed into Discord by
   hand — release notes from `CHANGELOG.md`, rules and terms from
   `src/features/policy/documents.ts`. Hand-typed content goes stale silently.
7. **Fail loudly.** A caught-and-ignored error is how a bug hides for months.
   Log it, surface it to `#bot-logs`, or let it throw — never swallow silently.

## Why TypeScript, specifically

The Archero 2 bot is a single ~3000-line `bot.js`. Its bugs were overwhelmingly
type bugs wearing other clothes: a field that was sometimes missing, a function
returning `undefined` where an object was expected, a role name that drifted
from the config. `strict` TypeScript catches that class of problem at build
time, which is the difference between a red CI run and a member quietly losing
a rank they earned.

Concretely, we lean on:

- `strict: true` plus `noUncheckedIndexedAccess` — indexing an array gives you
  `T | undefined`, which is the truth.
- Discriminated unions over optional-field soup.
- `unknown` at boundaries (LLM output, API responses), narrowed explicitly.
