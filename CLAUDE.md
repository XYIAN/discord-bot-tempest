# Tempest Bot — agent notes

Discord hub bot for the **Tempest** guild in **Wittle Defender** (Habby). TypeScript, discord.js v14, Node 22, deployed on Railway (auto-deploy from `main`).

## Architecture rules (keep these invariants)

- **Feature modules are the unit of everything.** Each folder in `src/features/` exports a `FeatureModule` (commands, events, jobs, init) registered only in `src/features/index.ts`. Features NEVER import each other — shared behavior lives in `src/lib/` (e.g. the achievements engine in `src/lib/achievements/service.ts` is how features record stats).
- **No hardcoded snowflakes or role-name strings in feature code.** All channels/roles/tiers/identity live in `src/config/guild.ts` (name-first, optional id override). Env config is parsed once in `src/config/env.ts` — read `ctx.config`, never `process.env`.
- **All state is persisted** via `ctx.stores.store<T>(name, defaults)` (atomic JSON files under `DATA_DIR`, one file per store). Never keep state that matters in module-level variables — redeploys are frequent. In-memory is OK only for throwaway rate-limit maps.
- **package.json is the single version source.** The releases feature posts deploy notices + changelog automatically on boot (dedupe is persisted). To ship release notes, add a `## [x.y.z]` section to CHANGELOG.md and bump the version — no manual posting.
- **No `Co-Authored-By`/`Generated with` trailers in commit messages.** Kyle's explicit rule — those trailers surfaced in the #bot-logs deploy notice and #changelog (both derive from the commit message) and read as useless noise. Deploy notices use only the commit subject line (`commitSubject`), and commits themselves must not carry the trailer.
- Interaction/handler errors are caught by the registry/scheduler — don't crash-guard every handler, but do keep independent steps (role grant vs message send) in separate try/catches when one shouldn't block the other.
- **All messaging goes through the bot token (single identity)** — never per-channel webhooks (Kyle's explicit preference over the archero2 bot's webhook spaghetti). The one exception: the lobby relay creates webhooks to impersonate relayed users' names/avatars across servers.
- **Notifications are additive — never replace a public announcement with a DM (or vice versa).** Kyle's explicit rule after an agent once swapped the #general welcome post for a DM on the old bot. Public post + `safeDm` (src/lib/discord/dm.ts) live side by side in separate try/catches.

## Commands

- `npm run dev` — tsx watch mode
- `npm run typecheck` / `npm test` / `npm run lint` — run all three before committing
- `npm run build && npm start` — what Railway runs

## Gotchas

- Slash commands are registered per-guild on `clientReady` — no separate registration script.
- The AI feature needs `ANTHROPIC_API_KEY` (preferred, claude-opus-5) or `OPENAI_API_KEY` (fallback, gpt-4o-mini); with neither it disables itself cleanly.
- The **weekly** memory-sync job (Sat 09:00 PT, an hour before the sync report) files LLM-extracted facts as **pending**; they only join the prompt after `/fact approve`. It was nightly — at this guild's volume that spent an LLM call most days on a handful of questions.
- `.env` is local only. Railway needs: DISCORD_TOKEN, DISCORD_CLIENT_ID, GUILD_ID, OWNER_ID, ANTHROPIC_API_KEY, DATA_DIR (pointing at a mounted volume).
