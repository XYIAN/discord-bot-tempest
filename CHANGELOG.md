# Changelog

All notable changes to Tempest Bot. The deploy pipeline posts the section
matching the current package.json version to #changelog automatically —
if a version has no section here, the git commit message is posted instead.

## [0.1.15] - 2026-08-01

🔁 **Swapping heroes is free** — Tempest AI now knows that hero level follows your main deployed five, not the individual hero.

Own a hero but never deployed them? They show Level 1. Swap them into your main five and the level comes with them. So you can rebuild toward any of the recommended lineups without re-levelling anything.

Stars work the opposite way: they come from that specific hero's shards and stay with them permanently. Star investment locks you into a hero, level investment doesn't.

## [0.1.14] - 2026-08-01

⚔️ **"What team should I run?"** — Tempest AI now knows Habby's own 13 recommended lineups, straight from the in-game Recommended screen.

- Every element (Ice-themed, Electro, Wind, Fire, Xenoscape) with its Top / Advanced / Basic tiers, the five heroes in each, and Habby's stated reasoning for why each hero is there
- Advanced and Basic share a Lineup Core within an element, so there's a clear upgrade path: keep the core, improve the four around it
- Three heroes that only exist in these lineups are now named — Void Witch (Celine), Peacekeeper (Karl) and Elemental Invoker (Omnis), all Xenoscape. Their skills aren't captured yet and the bot says so
- Element names are matched up both ways, so Frost/Ice and Electric/Electro are understood as the same thing

Still excluded on purpose: which lineups you've collected (that's your account), and any "this is the best comp" claim the game doesn't make itself.

## [0.1.13] - 2026-08-01

📸 **Tempest AI can see your screenshots** — post a picture of your roster, a hero page or any in-game screen in the AI channel and it will actually look at it.

Members were already doing this and getting "I can't see your current list of characters" back. Now a screenshot with no caption is a perfectly good question on its own.

- Up to 3 images per message (PNG, JPEG, GIF, WebP), 4MB each
- If an attachment is skipped — too big, wrong file type, failed download — it says which one and why, instead of quietly ignoring it
- Anything it reads off your screenshot stays yours: your levels, power and star tiers are treated as your account, never added to its general game knowledge
- Text inside an image is treated as untrusted, same as community-submitted facts, so a screenshot can't be used to feed it instructions

## [0.1.12] - 2026-08-01

🔒 **Tempest AI stops guessing** — it now answers game questions only from its verified facts, and says "I don't have that yet" instead of inventing details.

Caught on the first live test of v0.1.11: asked about a hero's EX-Weapon (data we deliberately haven't captured), the bot confidently made up a weapon name. The old prompt invited it to fill gaps with general Habby knowledge, which was reasonable when it knew almost nothing and actively harmful now that it knows the whole roster.

It still reasons freely — comparing heroes, suggesting comps, explaining trade-offs — but every name, number and mechanic it states has to come from the knowledge base. Known gaps (EX-Weapons, runes, treasures, pantheon, current meta) are now stated outright, so it points you at `/fact add` rather than filling the silence.

## [0.1.11] - 2026-08-01

📚 **Tempest AI knows the game now** — the knowledge base ships with **328 verified facts** covering all **42 heroes**, captured screen by screen from the Hero Gallery.

- Every hero: element, role, main skill, all four Ascend upgrades, passive levels, SP/Xenoscape skill, chain partner, and skin bonuses
- The mechanics behind them: the four-tier star ladder and what each star unlocks, how Battle Assistance scales (+3% → +8% → +15%), which heroes have chain skills and why the best ones don't, and how skins actually work
- Team-composition advice — who pairs with whom, and which heroes buff the team rather than themselves

Facts are committed to the repo, so they survive a lost data volume and get corrected by editing a file rather than retyping `/fact add`. Community submissions still work exactly as before and sit alongside these.

Deliberately **not** included: anything true of one account rather than the game (hero levels, power, ownership), and rules the capture couldn't settle — the AI says it doesn't know instead of guessing.

## [0.1.10] - 2026-07-30

🚨 **Data-loss alarm** — if persisted state (knowledge, achievements, activity) comes back empty or sharply smaller than a previous boot, the bot now posts a loud alert to #bot-logs instead of carrying on silently.

Ported from a real failure on the Archero 2 bot: its contribution ledger was silently emptied by a storage-volume change and, because "missing" was treated as "empty", nobody noticed for months — members quietly lost every rank they'd earned. Tempest isn't vulnerable to that same cause, but a detached volume would look identical, so it now watches for it.

## [0.1.9] - 2026-07-29

⚙️ Faster, cleaner shutdown — retired containers now flush state and exit promptly on redeploy instead of lingering, which was causing spurious Railway "deployment crashed" emails during normal deploys. (The bot was never actually down.)

## [0.1.8] - 2026-07-29

🧹 Deploy notices in #bot-logs now show only the commit's first line — no more commit-body/trailer noise cluttering the channel.

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
