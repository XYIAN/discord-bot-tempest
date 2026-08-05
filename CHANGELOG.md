# Changelog

All notable changes to Tempest Bot. The deploy pipeline posts the section
matching the current package.json version to #changelog automatically —
if a version has no section here, the git commit message is posted instead.

## [0.2.1] - 2026-08-05

### Role labels are game claims too

With retrieval fixed the right facts now arrive — and the bot still called Blazing Archer "a main DPS" one sentence after correctly quoting his team CRIT DMG passive, then added that he "lacks team buffs beyond his own scaling". It cited the buff and denied it existed, in adjacent sentences.

The anti-invention rule covered hero names, skill names, weapons, numbers, percentages and mechanics. It said nothing about **roles**, so the model treated "main DPS" as free commentary rather than a claim about the game.

- Roles now count: no labelling a hero a main DPS, carry, support, tank, healer or buffer unless the facts say so. Most facts describe mechanics, so the bot describes the mechanic and lets the member draw the conclusion.
- A passive that buffs the team **is** a team buff — it may not call a hero buff-less while quoting one.
- Asked point-blank whether a hero is a main damage dealer with nothing in the facts to say so, it now explains what the kit does and says the facts do not assign a role.
- Added an explicit self-consistency check before sending.

## [0.2.0] - 2026-08-05

### The bot was answering from 11% of what it knows

Members reported it calling Swordmaster a Xenoscape hero, calling Blazing Archer "your main damage dealer", and getting hero elements wrong. Every one of those facts is present and correct in the knowledge base. None of it was a data problem — the answering fact never reached the model, and an LLM with no fact fills the gap by inventing one.

**The budget was 12,000 characters against a corpus that had grown to 105,045.** So roughly 89% of the roster was withheld from every single answer. Raised to 140,000: all 420 facts now go in on every question, ~26k tokens. That is deliberately below the ~38k the sibling Archero 2 bot ships, where facts were measured recalled byte-perfectly from the start, middle and end of the prompt — so this size is known-safe rather than hoped-safe.

**"sword master" and "Swordmaster" were different heroes to the scorer.** Members type hero names with spaces; the data spells several as one word. Under token matching they share nothing, so *"is sword master a xenoscape hero?"* scored **zero** against the very fact saying he is Mythic/Wind. Names are now matched on a squashed form, so `night baron`, `Night Baron`, `nightbaron` and `night-baron` are all the same hero.

**Naming a hero now pins that hero's whole fact family.** Answering "is X any good?" needs identity, passive *and* synergy together. Retrieving one of the three yields a confident half-answer — which is exactly how Blazing Archer became a "main damage dealer": his personal CRIT Ascend was visible while his team-buff passive was not.

**Retrieval now sees the conversation, not just the last message.** It scored the current message alone while the model was sent the whole thread, so in a multi-turn discussion the model kept talking about heroes whose facts had been dropped several turns back — answering from its own earlier wording instead of from data. That is precisely how the Blazing Archer claim survived a member's correction: their message was about Scarlet Reaper, so his passive was not in that prompt at all.

**Selection no longer pads the prompt.** Leftover budget used to be filled with whatever came first in the file, so an unmatched question got ~48 arbitrary facts presented under "verified facts" — actively misleading rather than merely useless. Zero-scoring facts are now excluded, ties are stable, and scoring counts distinct terms so a long fact repeating a word cannot outrank a short precise one.

`npx tsx src/scripts/retrieval-report.ts "your question"` now shows exactly what reaches the model, so "did the fact arrive?" can be answered in one command — a different bug from the model misreading a fact it was given.

26 new tests, each verified to fail against the old behaviour.

## [0.1.21] - 2026-08-03

🔧 **No more false "deployment crashed" emails.** Every normal redeploy was sending one, and the bot was never actually down.

The cause was the start command: Railway signalled `npm`, which reported its own child being stopped as a failure and exited with an error code. Running the bot directly means a redeploy now exits cleanly.

Also tidies up the shutdown so the health endpoint closes properly instead of being left for the process to tear down.

⚠️ Note on last release: `/mod kick` and `/mod ban` are shipped but have **not** been tested live yet — the rest of `/mod` has. Test on a throwaway account before relying on them.

## [0.1.20] - 2026-08-02

🛡️ **Moderation tools** — officers and admins can finally manage the server through the bot with `/mod`.

- **Officers:** add and remove roles, timeout a member (`30m`, `2h`, up to 7d), lift a timeout
- **Admins:** all of the above, plus kick, ban and unban

Timeouts and bans DM the member with the reason, every action is posted to #bot-logs so staff can see what each other did, and the bot refuses anything Discord would reject — with a sentence explaining why instead of a silent failure.

## [0.1.19] - 2026-08-02

📜 **Rules and Terms now live in the server** — a new RULES & INFO section with #rules and #terms-and-privacy, readable by everyone.

Plain language, no legalese: what the bot keeps, that some messages reach third-party AI services, and that questions in the AI channel may become general game facts after a moderator reviews them. Rules cover the usual — be decent, no spam, no advertising, and no buying or selling accounts.

Both are written in the repo and republish themselves when the text changes, so they can't quietly go out of date. `/terms` links them any time.

## [0.1.18] - 2026-08-02

💸 **Memory sync moved to weekly** — it was running every night, spending an AI call on whatever handful of questions came in that day. Now it runs Saturday morning, an hour before the weekly report, so the report covers what it just found.

Two fixes that came with it: the sync now reads the *newest* conversations rather than the oldest (a busy stretch used to get deleted unread), and it no longer sends the entire 400-fact knowledge base along with every request.

## [0.1.17] - 2026-08-02

🧹 **The recruiting post now replaces itself** instead of piling up — #recruiting keeps exactly one, always the newest.

The bot remembers the post it made and removes it once the replacement is safely up. Applications from `/guild apply` in the same channel are never touched, and a post someone deleted by hand is handled quietly.

## [0.1.16] - 2026-08-02

🗡️ **EX-Weapons, all 26 of them** — Tempest AI can finally answer what a hero's EX-Weapon is and what it does, instead of saying it doesn't know.

- Every Mythic and Sublime hero's EX-Weapon: its name, the skill it teaches, and what its upgrade nodes actually change
- How the system works: a weapon teaches one extra active skill that auto-casts every 25 seconds, EX-Weapon Energy is per-hero rather than a shared pool, and enhancement is gated behind that hero's star tier — so "should I star up?" and "should I enhance?" are the same question
- Three heroes from the recommended lineups are now fully captured: Void Witch, Peacekeeper and Elemental Invoker

**Corrections.** Every EX-Weapon name previously guessed from skill text was wrong — a weapon and the skill it teaches have different names. Polar Captain's weapon is Sunken Engulfer; Ghost Fleet is the skill it grants. All the guessed names have been replaced with ones read off the screen.

Still unknown, and still said out loud: runes, treasures, sigils, gear, emblems and the pantheon.

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
