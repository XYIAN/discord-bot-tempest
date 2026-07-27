import type { Guild } from 'discord.js';
import type { BotContext } from '../../core/types.js';

/** The single guild this bot serves, from GUILD_ID config. */
export function getHomeGuild(ctx: BotContext): Guild | undefined {
  const guild = ctx.client.guilds.cache.get(ctx.config.guildId);
  if (!guild) ctx.logger.warn(`Home guild ${ctx.config.guildId} not in cache — is the bot invited?`);
  return guild;
}
