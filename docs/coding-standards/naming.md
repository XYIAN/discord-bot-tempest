# Naming

Casing is not a matter of taste here — it encodes what a thing *is*, so you can
tell a type from a value from a constant without looking it up.

| Thing | Case | Example |
|---|---|---|
| Files | `kebab-case.ts` | `memory-sync.ts`, `json-store.ts` |
| Test files | mirror the source | `memory-sync.test.ts` |
| Folders | `kebab-case` | `features/daily-reset/` |
| Types, interfaces, enums | `PascalCase` | `BotContext`, `FeatureModule`, `PolicyDocument` |
| Functions, variables, params | `camelCase` | `buildDocuments`, `lastPostedAt` |
| Module-level constants | `SCREAMING_SNAKE` | `MAX_QA_LOG`, `COOLDOWN_MS` |
| Object keys in stores | `camelCase` | `{ lastMessageId, lastChannelId }` |
| Discord channel + role names | as they appear in Discord | `'bot-logs'`, `'Storm Watcher'` |

## Rules that are not just casing

**Booleans read as assertions.** `isModerator`, `hasImages`, `canVerify` — not
`moderator`, `images`, `verify`.

**Units belong in the name.** `COOLDOWN_MS`, `intervalDays`, `MAX_IMAGE_BYTES`.
A bare `timeout` has caused a production bug in every codebase ever written.

**Functions that hit Discord say so.** `sendToChannel`, `deleteMessageById`,
`safeDm`. Pure helpers do not: `documentHash`, `takeWithinBudget`,
`extractVersionNotes`. You should be able to tell what needs mocking from the
name alone.

**`safe*` means it never throws.** `safeDm` swallows a closed-DM error because
a blocked DM must not fail the surrounding flow. If a function is named `safe`,
callers are entitled to skip the try/catch.

**Stores are named for their contents, singular-ish and kebab.** `'knowledge'`,
`'qa-log'`, `'recruiting'`, `'policy'`. The store name becomes a filename on
the volume, so it must never change casually — renaming one orphans live data.

**Seed and document keys are permanent identifiers.** `SeedFact.key`,
`PolicyDocument.key`. They tie code to already-persisted records. Changing one
orphans the old record and files a duplicate; there are comments saying so at
both definitions.
