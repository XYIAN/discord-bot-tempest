import type { Message } from 'discord.js';

/**
 * True only for a real human message in the home guild — excludes bots and
 * Discord system messages (member joins, boosts, pins). The join system
 * message is delivered through `messageCreate` with the new member as
 * author and empty content, which is why every message-counting feature
 * must gate on this rather than on `author.bot` alone.
 *
 * The type predicate narrows to `Message<true>`, giving callers the
 * in-guild fields (`guild`, `member`, non-null `guildId`) without a
 * separate `inGuild()` check.
 */
export function isHumanGuildMessage(message: Message, guildId: string): message is Message<true> {
  return !message.author.bot && !message.system && message.inGuild() && message.guildId === guildId;
}
