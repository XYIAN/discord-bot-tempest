# Deploys, Railway and releases

## The pipeline

`git push origin main` → Railway auto-builds → the bot boots → it announces
itself. Nothing is posted by hand.

1. `package.json` `version` is the **single source of truth**.
2. Add a `## [x.y.z]` section to `CHANGELOG.md` describing the change *for
   members*, not for developers.
3. Bump the version, commit, push.
4. On boot the releases feature posts a deploy notice to `#bot-logs` and, if
   the version is new, the changelog section to `#changelog`. If no section
   matches, it falls back to the commit subject.

Dedupe is **persisted**, keyed on Railway's deployment id — not scraped from
channel history — so a crash-loop restart cannot spam the channel.

## Verifying a deploy without guessing

Railway's email can lie. It reports the *old* container exiting during handoff
as a crash; v0.1.9 reduced that but it still fires. Check the bot instead:

```bash
# Did the new version actually boot and report in?
curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
  "https://discord.com/api/v10/channels/<bot-logs-id>/messages?limit=1"

# Is it a healthy single instance, or a crash-loop?
curl -s -H "Authorization: Bot $DISCORD_TOKEN" \
  https://discord.com/api/v10/gateway/bot
```

`session_start_limit.total - remaining` should tick up by roughly **one per
deploy**. A crash-loop burns them fast — that number is the single most
reliable health signal available without Railway access.

## Environment

`.env` is local only. Railway needs: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`,
`GUILD_ID`, `OWNER_ID`, an LLM key, and `DATA_DIR` pointed at a mounted volume.

**The volume is the dangerous part.** On the Archero 2 bot a volume mounted
empty, shadowed the committed `data/` files, and silently emptied the whole
contribution ledger — nobody noticed for months because "missing" was treated
as "empty". Two rules came out of that:

- Empty critical state is an **alarm**, not a default. `checkStoreIntegrity`
  compares against high-water marks each boot and shouts in `#bot-logs`.
- Anything we author ourselves ships **in the repo** and is reapplied on boot
  (`applySeedFacts`, the policy documents), so losing the volume loses only
  community-contributed data, never curated content.

## Never

- Never commit with `Co-Authored-By` or `Generated with` trailers. They surface
  in the `#bot-logs` deploy notice and `#changelog`, which are derived from the
  commit message, and read as noise to members.
- Never push a version bump without a matching CHANGELOG section, unless the
  change is genuinely invisible to members.
- Never hand-edit content in Discord that the bot publishes — the next deploy
  overwrites it, and the repo is the source of truth.
