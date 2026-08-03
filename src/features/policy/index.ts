import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { resolveTextChannel } from '../../lib/discord/resolve.js';
import { COLORS, sendToChannel, stormEmbed } from '../../lib/discord/send.js';
import {
  buildDocuments,
  documentHash,
  documentsNeedingPublish,
  type PolicyDocument,
  type PolicyState,
} from './documents.js';

/**
 * Publishes the server's rules and terms into their own read-only channels, generated from committed content (documents.ts).
 *
 * The reference bot posted these by hand once; both documents there are now
 * stale and describe a bot that has since changed. Here the text lives in the
 * repo, and editing it republishes on the next deploy — the same reason
 * release notes come from CHANGELOG.md rather than someone remembering.
 *
 * Existing posts are EDITED in place rather than deleted and reposted, so the
 * channels never accumulate copies and nobody gets re-pinged for a typo fix.
 */

function channelRef(ctx: BotContext, doc: PolicyDocument) {
  return ctx.guild.channels[doc.channel];
}

async function publish(ctx: BotContext): Promise<{ published: number; skipped: number }> {
  const guild = getHomeGuild(ctx);
  if (!guild) return { published: 0, skipped: 0 };
  const log = ctx.logger.child('policy');
  const store = ctx.stores.store<PolicyState>('policy', { docs: {} });
  const state = await store.get();

  const all = buildDocuments(ctx.guild);
  const pending = documentsNeedingPublish(all, state);
  if (pending.length === 0) return { published: 0, skipped: all.length };

  let published = 0;
  for (const doc of pending) {
    const ref = channelRef(ctx, doc);
    const embed = stormEmbed(doc.title, doc.body).setColor(COLORS.primary);
    const previous = state.docs[doc.key];

    // Prefer editing the message already there — keeps one post per channel.
    if (previous) {
      const channel = resolveTextChannel(guild, ref);
      if (channel) {
        try {
          const existing = await channel.messages.fetch(previous.messageId);
          await existing.edit({ embeds: [embed] });
          await store.update((s) => ({
            docs: { ...s.docs, [doc.key]: { messageId: existing.id, channelId: channel.id, hash: documentHash(doc) } },
          }));
          published++;
          continue;
        } catch {
          // Deleted, or in a channel that no longer exists — fall through and
          // post a fresh one rather than losing the document entirely.
          log.info(`Previous ${doc.key} post is gone; posting a new one`);
        }
      }
    }

    const sent = await sendToChannel(guild, ref, { embeds: [embed] }, log);
    if (!sent) continue;
    await store.update((s) => ({
      docs: { ...s.docs, [doc.key]: { messageId: sent.id, channelId: sent.channelId, hash: documentHash(doc) } },
    }));
    published++;
  }

  if (published > 0) log.info(`Published ${published} policy document(s)`);
  return { published, skipped: all.length - pending.length };
}

const policyCommand = {
  data: new SlashCommandBuilder()
    .setName('terms')
    .setDescription('Show the server rules and terms')
    .toJSON(),
  async execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
    const guild = interaction.guild;
    const links = buildDocuments(ctx.guild).map((doc) => {
      const channel = guild ? resolveTextChannel(guild, channelRef(ctx, doc)) : undefined;
      return channel ? `• ${doc.title} — <#${channel.id}>` : `• ${doc.title}`;
    });
    await interaction.reply({
      embeds: [
        stormEmbed(
          '📖 Server info',
          [...links, '', 'These are kept up to date automatically.'].join('\n'),
        ).setColor(COLORS.primary),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export function policyFeature(): FeatureModule {
  return {
    name: 'policy',
    commands: [policyCommand],
    async init(ctx) {
      // Content-hashed, so a redeploy with unchanged text is a no-op.
      await publish(ctx);
    },
  };
}
