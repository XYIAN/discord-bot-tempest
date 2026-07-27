# ⛈️ Tempest Bot

The Discord hub for the **Tempest** guild in **Wittle Defender** (Habby / Gorilla Studio) — community, recruiting, achievements, and an AI that learns the game from its players.

## Features

| Feature | What it does |
|---|---|
| **Welcome** | Auto-role + welcome embed in #general + DM tour for every new member |
| **Daily reset** | Reset checklist posted to #general at the in-game reset (9am PT) |
| **Activity ranks** | Chat to earn points; tier roles from Storm Recruit → Eye of the Storm. `/rank`, `/leaderboard` |
| **Achievements** | Milestones for chatting, daily streaks, AI contributions, joining the guild. `/achievements` |
| **Guild tools** | `/guild info`, `/guild apply` (pings officers), `/guild verify`; recruiting post every 2 days (persisted cadence) |
| **Tempest AI** | Ask anything in #tempest-ai. Powered by Claude. Teach it with `/fact add` (moderated); a nightly memory-sync extracts new facts from conversations for review |
| **Cross-server lobby** | Links members to the shared lobby channel; optional webhook relay across servers via `LOBBY_CHANNEL_IDS` |
| **Autonomous releases** | Every Railway deploy posts a notice to #bot-logs and release notes to #changelog (from CHANGELOG.md, falling back to the commit message); warn/error logs stream to #bot-logs |

## Architecture

```
src/
├── index.ts            boot: config → client → registry → scheduler → health
├── config/
│   ├── env.ts          typed env parsing (fail-fast, all problems listed)
│   └── guild.ts        channels/roles/tiers/identity — the only place they're defined
├── core/               framework: FeatureModule contract, registry, cron scheduler,
│                       logger (with listeners), health server, login retry
├── lib/                shared services: json store (atomic, persisted), discord helpers,
│                       LLM abstraction (Anthropic/OpenAI), achievements engine
└── features/           self-contained modules — commands + events + jobs each
```

Principles: features never import each other; nothing important lives in memory; no hardcoded IDs; one version source (package.json).

## Setup

```bash
cp .env.example .env   # fill in tokens/ids
npm install
npm run dev
```

Create the server roles/channels named in `src/config/guild.ts` (or change the names there to match your server).

### Deploy (Railway)

Auto-deploys from `main`. Set env vars (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `GUILD_ID`, `OWNER_ID`, `ANTHROPIC_API_KEY`), mount a volume and set `DATA_DIR` to its path. Health check: `/health`.

## Development

```bash
npm run typecheck && npm test && npm run lint
```

Releases: bump `package.json` version + add a `## [x.y.z]` section to `CHANGELOG.md`, push to `main`. The bot announces itself.
