# Changelog

All notable changes to Tempest Bot. The deploy pipeline posts the section
matching the current package.json version to #changelog automatically —
if a version has no section here, the git commit message is posted instead.

## [0.1.7] - 2026-07-29

🐛 **Fix: "First Words" no longer fires the instant you join** — Discord's member-join system message was being counted as a real message. All message-counting features now share one `isHumanGuildMessage` guard that excludes bots and system messages (joins, boosts, pins), so achievements and activity points only count actual human messages.

## [0.1.6] - 2026-07-27

🌫️ **Everyone starts a Storm Watcher** — new identity for the base member role:

- New members are auto-granted **Storm Watcher** on join (was "Defender"); the Tempest name stays reserved for actual guild members
- The whole ladder is now color-graded from misty gray to electric cyan — watch the member list light up as people climb
- Eye of the Storm and Tempest Guild members display in their own sidebar sections
- Welcome messages now tell the journey: Storm Watcher → storm ranks → inside the storm (the guild)

## [0.1.5] - 2026-07-27

🔄 **Weekly knowledge sync** — the old bot's manual sync-facts ritual is now fully automatic:

- Every Saturday 10am PT, a sync report posts to #bot-logs: new facts, pending reviews, top contributors — with the complete knowledge base attached as a JSON backup
- Skips itself quietly when nothing changed that week
- `/fact sync` (moderators) runs it on demand anytime

## [0.1.4] - 2026-07-27

💌 **Personal touch** — DMs now accompany (never replace!) public announcements:

- Fact approved/rejected → the contributor gets a DM (rejections can include a moderator reason via the new `reason` option)
- Activity rank-ups → DM alongside the #general shout-out
- Contributor tier-ups → DM alongside the channel announcement
- `/guild verify` → welcome-to-the-guild DM alongside the channel post

## [0.1.3] - 2026-07-27

- Daily reset reminder now fires at the correct time — 9am Pacific (was 5pm)

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
