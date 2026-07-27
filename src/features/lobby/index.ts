import { WebhookClient, type Message } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { defineEvent } from '../../core/types.js';

/**
 * Cross-server lobby.
 *
 * The lobby channel itself is a native Discord shared/lobby channel (like
 * the Archero 2 server's #cross-server) — welcome copy links people to it.
 * Optionally, when LOBBY_CHANNEL_IDS lists 2+ channel ids across servers
 * the bot is in, this module also relays messages between them via
 * webhooks so partner servers share one conversation.
 */

async function relay(ctx: BotContext, message: Message): Promise<void> {
  const ids = ctx.config.lobbyChannelIds;
  if (ids.length < 2) return;
  if (message.author.bot || message.webhookId) return;
  if (!ids.includes(message.channelId)) return;
  const log = ctx.logger.child('lobby');

  for (const targetId of ids) {
    if (targetId === message.channelId) continue;
    try {
      const channel = await ctx.client.channels.fetch(targetId);
      if (!channel?.isTextBased() || channel.isDMBased() || !('fetchWebhooks' in channel)) continue;
      const webhooks = await channel.fetchWebhooks();
      let hook = webhooks.find((w) => w.name === 'tempest-lobby-relay' && w.token);
      hook ??= await channel.createWebhook({ name: 'tempest-lobby-relay' });
      if (!hook.token) continue;
      await new WebhookClient({ id: hook.id, token: hook.token }).send({
        content: message.content || '*[attachment]*',
        username: `${message.author.displayName} · ${message.guild?.name ?? 'lobby'}`,
        avatarURL: message.author.displayAvatarURL(),
        allowedMentions: { parse: [] },
        files: message.attachments.map((a) => a.url).slice(0, 4),
      });
    } catch (error) {
      log.error(`Relay to ${targetId} failed`, error);
    }
  }
}

export function lobbyFeature(): FeatureModule {
  return {
    name: 'lobby',
    events: [
      defineEvent({
        event: 'messageCreate',
        handler: (ctx, message) => relay(ctx, message),
      }),
    ],
    init(ctx) {
      const count = ctx.config.lobbyChannelIds.length;
      if (count >= 2) ctx.logger.info(`Lobby relay active across ${count} channels`);
      else ctx.logger.info('Lobby relay idle (fewer than 2 LOBBY_CHANNEL_IDS configured)');
    },
  };
}
