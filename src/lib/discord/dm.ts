import type { EmbedBuilder } from 'discord.js';
import type { BotContext } from '../../core/types.js';

/**
 * Best-effort DM. DMs are always ADDITIVE to public announcements — never
 * a replacement (Kyle's rule) — so a closed-DM failure is logged at debug
 * and never propagates.
 */
export async function safeDm(ctx: BotContext, userId: string, embed: EmbedBuilder): Promise<void> {
  try {
    const user = await ctx.client.users.fetch(userId);
    await user.send({ embeds: [embed] });
  } catch {
    ctx.logger.debug(`Could not DM user ${userId} (DMs likely closed)`);
  }
}
