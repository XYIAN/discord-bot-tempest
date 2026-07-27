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
