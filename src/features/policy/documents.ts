import { createHash } from 'node:crypto';
import type { GuildConfig } from '../../config/guild.js';

/**
 * The server's rules and terms — authored here rather than
 * typed into Discord by hand, so they can be reviewed in a diff and can never
 * silently go stale. Editing the text below republishes it on the next deploy.
 *
 * Deliberately plain. This is a game guild's Discord, not a SaaS product: it
 * says what is kept and that some messages reach third-party language models,
 * without naming vendors, describing storage, or explaining the code.
 */

export interface PolicyDocument {
  /** Stable id — used to track the published message. Never reuse or rename. */
  key: string;
  /** Which configured channel it belongs in. */
  channel: 'rules' | 'terms';
  title: string;
  body: string;
}

export function buildDocuments(guild: GuildConfig): PolicyDocument[] {
  const { identity } = guild;
  return [
    {
      key: 'rules',
      channel: 'rules',
      title: '📜 Server Rules',
      body: [
        `Welcome to **${identity.guildName}**. Keep it simple:`,
        '',
        '**1. Be decent to each other.** Banter is fine, harassment, slurs and personal attacks are not.',
        '**2. Keep it roughly on-topic.** This is a **' + identity.gameName + '** community — use the right channel where one exists.',
        '**3. No spam.** Includes mass pings, chain messages, and dumping the same thing in several channels.',
        '**4. No advertising or soliciting.** No promoting other servers, streams or services without an admin saying yes first.',
        '**5. No buying, selling or trading accounts,** in-game currency, or real-money services. This also breaks the game\'s own rules and gets people scammed.',
        '**6. No NSFW, gore, or illegal content.**',
        '**7. No cheats, hacks, exploits or modded clients** — and don\'t share them here.',
        '**8. Follow Discord\'s own Terms of Service and Community Guidelines.**',
        '',
        'Admins and officers can remove messages, mute, kick or ban to keep the server pleasant. If something needs attention, ping an officer rather than handling it yourself.',
      ].join('\n'),
    },
    {
      key: 'terms',
      channel: 'terms',
      title: '🔐 Terms & Privacy',
      body: [
        `By using **${identity.botName}** and this server, you agree to the following.`,
        '',
        '**What we keep**',
        'To make the bot work we store things like your Discord user ID, your messages to the bot, and activity counts used for ranks and achievements. We keep it only as long as it is useful, and we do not sell it or hand it to anyone for advertising.',
        '',
        '**Third-party AI**',
        'Some messages — including screenshots you send the bot — are passed to third-party language model services for parsing and generating replies. Do not send the bot anything private, personal or sensitive.',
        '',
        '**Community knowledge**',
        'Questions asked in the AI channel may be reviewed and turned into general game facts the bot uses to answer everyone. This is reviewed by a moderator first, and is about the game — not about you.',
        '',
        '**Using the bot**',
        'Use it in good faith. Do not spam it, try to break it, or use it to harass anyone. It is provided as-is with no promise of uptime, and it can be wrong — check anything important in game.',
        '',
        '**Your choices**',
        'Ask an admin if you want your data removed, or if you have any question about this. Leaving the server is always an option and we will not hold it against you.',
        '',
        'These terms may change; the newest version is always the one in this channel.',
      ].join('\n'),
    },
  ];
}

/** Content fingerprint — republish exactly when the text actually changes. */
export function documentHash(doc: PolicyDocument): string {
  return createHash('sha256').update(`${doc.title}\n${doc.body}`).digest('hex').slice(0, 16);
}

export interface PublishedDoc {
  messageId: string;
  channelId: string;
  hash: string;
}

export interface PolicyState {
  docs: Record<string, PublishedDoc>;
}

/**
 * Which documents actually need work. Unchanged documents are skipped so a
 * redeploy doesn't churn the channels — the same reason releases dedupes by
 * version rather than re-reading channel history.
 */
export function documentsNeedingPublish(
  docs: PolicyDocument[],
  state: PolicyState,
): PolicyDocument[] {
  return docs.filter((doc) => state.docs[doc.key]?.hash !== documentHash(doc));
}
