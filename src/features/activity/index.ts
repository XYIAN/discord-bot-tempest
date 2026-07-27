import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type Message } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { defineEvent } from '../../core/types.js';
import { safeDm } from '../../lib/discord/dm.js';
import { resolveRole } from '../../lib/discord/resolve.js';
import { sendToChannel, stormEmbed } from '../../lib/discord/send.js';
import type { Tier } from '../../config/guild.js';

/**
 * Activity XP: chatting earns points (with a per-user cooldown); crossing
 * a tier threshold awards the tier role and announces it. All state is
 * persisted — no cooldown or progress is lost on redeploy.
 */

export interface ActivityRecord {
  points: number;
  lastPointAt: number;
  username: string;
}

export type ActivityState = Record<string, ActivityRecord>;

export function tierFor(points: number, tiers: Tier[]): Tier | undefined {
  return [...tiers].reverse().find((t) => points >= t.threshold);
}

export function nextTier(points: number, tiers: Tier[]): Tier | undefined {
  return tiers.find((t) => points < t.threshold);
}

function progressBar(current: number, target: number, width = 12): string {
  const ratio = Math.max(0, Math.min(1, current / target));
  const filled = Math.round(ratio * width);
  return `${'▰'.repeat(filled)}${'▱'.repeat(width - filled)}`;
}

async function onMessage(ctx: BotContext, message: Message): Promise<void> {
  if (message.author.bot || !message.inGuild() || message.guildId !== ctx.config.guildId) return;
  const channelName = 'name' in message.channel ? (message.channel.name ?? '') : '';
  if (ctx.guild.activity.excludedChannels.includes(channelName)) return;

  const store = ctx.stores.store<ActivityState>('activity', {});
  const now = Date.now();
  const cooldownMs = ctx.guild.activity.cooldownSeconds * 1000;

  let promoted: Tier | undefined;
  await store.update((state) => {
    const record = state[message.author.id] ?? { points: 0, lastPointAt: 0, username: '' };
    if (now - record.lastPointAt < cooldownMs) return state;
    const before = tierFor(record.points, ctx.guild.activityTiers);
    record.points += ctx.guild.activity.pointsPerMessage;
    record.lastPointAt = now;
    record.username = message.author.username;
    const after = tierFor(record.points, ctx.guild.activityTiers);
    if (after && after !== before) promoted = after;
    state[message.author.id] = record;
    return state;
  });

  if (promoted && message.member) {
    const log = ctx.logger.child('activity');
    try {
      const role = resolveRole(message.guild, promoted.role);
      if (role) await message.member.roles.add(role);
    } catch (error) {
      log.error(`Failed to grant tier role ${promoted.role.name}`, error);
    }
    // Public shout-out in #general AND a personal DM — additive, never either/or.
    await sendToChannel(
      message.guild,
      ctx.guild.channels.general,
      {
        embeds: [
          stormEmbed(
            '⚡ Rank up!',
            `<@${message.author.id}> just reached **${promoted.role.name}** (${promoted.threshold} activity points)!`,
          ),
        ],
      },
      log,
    );
    await safeDm(
      ctx,
      message.author.id,
      stormEmbed(
        `⚡ You reached ${promoted.role.name}!`,
        `Your activity in the ${ctx.guild.identity.guildName} server just earned you the **${promoted.role.name}** role (${promoted.threshold} points). Check your progress anytime with \`/rank\`. ⛈️`,
      ),
    );
  }
}

const rank = {
  data: new SlashCommandBuilder().setName('rank').setDescription('Your activity level and progress').toJSON(),
  async execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
    const state = await ctx.stores.store<ActivityState>('activity', {}).get();
    const record = state[interaction.user.id];
    const points = record?.points ?? 0;
    const current = tierFor(points, ctx.guild.activityTiers);
    const next = nextTier(points, ctx.guild.activityTiers);
    const lines = [
      `**${points}** activity points`,
      `Current tier: **${current?.role.name ?? 'Unranked'}**`,
    ];
    if (next) {
      lines.push(`Next: **${next.role.name}** at ${next.threshold}`, progressBar(points, next.threshold) + ` ${points}/${next.threshold}`);
    } else if (current) {
      lines.push('Top of the ladder — the storm bows to you. ⛈️');
    }
    await interaction.reply({ embeds: [stormEmbed(`${interaction.user.displayName}'s rank`, lines.join('\n'))] });
  },
};

const leaderboard = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Most active members').toJSON(),
  async execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
    const state = await ctx.stores.store<ActivityState>('activity', {}).get();
    const top = Object.entries(state)
      .sort(([, a], [, b]) => b.points - a.points)
      .slice(0, 10);
    if (top.length === 0) {
      await interaction.reply({ content: 'No activity recorded yet — start chatting!', flags: MessageFlags.Ephemeral });
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map(([userId, record], i) => {
      const tier = tierFor(record.points, ctx.guild.activityTiers);
      return `${medals[i] ?? `**${i + 1}.**`} <@${userId}> — ${record.points} pts${tier ? ` · ${tier.role.name}` : ''}`;
    });
    await interaction.reply({
      embeds: [stormEmbed(`⛈️ ${ctx.guild.identity.guildName} leaderboard`, lines.join('\n'))],
    });
  },
};

export function activityFeature(): FeatureModule {
  return {
    name: 'activity',
    commands: [rank, leaderboard],
    events: [defineEvent({ event: 'messageCreate', handler: onMessage })],
  };
}
