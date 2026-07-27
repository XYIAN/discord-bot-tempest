# Changelog

All notable changes to Tempest Bot. The deploy pipeline posts the section
matching the current package.json version to #changelog automatically —
if a version has no section here, the git commit message is posted instead.

## [0.1.2] - 2026-07-27

- **New `/reset` command** — countdown to the next Wittle Defender daily reset, shown in your own timezone
- Tempest AI now says clearly when the API account is out of credits (instead of a generic error)
- Server got its storm icon ⛈️ and channels are organized under the TAI / Guild categories

## [0.1.1] - 2026-07-27

🛡️ **Hardening pass** — 25 findings from a full multi-agent code review, all fixed:

- AI answers and log forwards can no longer ping anyone (mention-injection proofed)
- Community facts and chat transcripts are now treated as untrusted data in AI prompts
- Per-user daily AI budget (40 questions) + question length cap on top of the cooldown
- Fact approvals can't double-credit contributors; missed tier thresholds now self-heal
- Rejoining members get their roles back; welcome only fires for the home server
- `/guild apply` reports failures honestly and is rate-limited (no officer ping spam)
- Nightly memory-sync no longer discards conversations logged mid-sync
- Graceful shutdown flushes pending state writes; deploy notices dedupe across restarts

## [0.1.0] - 2026-07-27

⛈️ **Tempest Bot is born!** The Tempest guild hub for Wittle Defender.

- **Welcome crew** — new members get a role, a warm welcome in #general, and a DM tour
- **Daily reset reminders** — checklist posted to #general at game reset
- **Activity ranks** — chat to earn points, climb from Storm Recruit to Eye of the Storm (`/rank`, `/leaderboard`)
- **Achievements** — unlock milestones for chatting, daily streaks, and teaching the AI (`/achievements`)
- **Guild tools** — `/guild info`, `/guild apply` (pings officers), officer `/guild verify`, auto recruiting posts
- **Tempest AI** — ask anything about Wittle Defender in #tempest-ai; teach it with `/fact add`; it grows its own memory nightly from conversations (moderator-reviewed)
- **Cross-server lobby** — welcome flow points everyone to the shared lobby channel
- **Autonomous releases** — every Railway deploy announces itself in #bot-logs and posts release notes to #changelog; warnings/errors stream to #bot-logs
