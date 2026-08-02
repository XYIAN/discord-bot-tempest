import { EmbedBuilder, type Guild, type MessageCreateOptions } from 'discord.js';
import type { ChannelRef } from '../../config/guild.js';
import type { Logger } from '../../core/logger.js';
import { resolveTextChannel } from './resolve.js';

export const COLORS = {
  primary: 0x5865f2,
  storm: 0x4aa8d8,
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
} as const;

export function stormEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(COLORS.storm).setTitle(title).setTimestamp();
  if (description) embed.setDescription(description);
  return embed;
}

/**
 * Send to a configured channel; logs (rather than throws) when the channel
 * is missing or the send fails, so one broken channel never takes down a
 * feature. Returns the sent message or undefined.
 */
export async function sendToChannel(
  guild: Guild,
  ref: ChannelRef,
  payload: string | MessageCreateOptions,
  logger: Logger,
) {
  const channel = resolveTextChannel(guild, ref);
  if (!channel) {
    logger.warn(`Channel #${ref.name}${ref.id ? ` (${ref.id})` : ''} not found; skipping send`);
    return undefined;
  }
  try {
    return await channel.send(payload);
  } catch (error) {
    logger.error(`Failed to send to #${channel.name}`, error);
    return undefined;
  }
}

/** Discord API error code for a message that no longer exists. */
const UNKNOWN_MESSAGE = 10008;

/**
 * Delete a message the bot posted earlier, by id. Used to replace recurring
 * posts instead of letting them pile up.
 *
 * Never throws: a message someone already deleted by hand is the normal case,
 * not an error, and a failed cleanup must never stop the caller from posting.
 * Returns whether the message was actually deleted.
 */
export async function deleteMessageById(
  guild: Guild,
  channelId: string | undefined,
  messageId: string | undefined,
  logger: Logger,
): Promise<boolean> {
  if (!channelId || !messageId) return false;
  try {
    const channel =
      guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || !channel.isTextBased()) return false;
    const message = await channel.messages.fetch(messageId);
    await message.delete();
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === UNKNOWN_MESSAGE) {
      // Already gone — someone cleaned it up manually. Expected, not a problem.
      logger.info(`Previous message ${messageId} was already deleted`);
      return false;
    }
    logger.warn(`Could not delete message ${messageId}`, error);
    return false;
  }
}
