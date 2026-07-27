import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { guildConfig } from '../../config/guild.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { sendToChannel, stormEmbed } from '../../lib/discord/send.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';

/**
 * Posts the daily reset reminder to general at the configured in-game
 * reset time. State (last posted date) is persisted so a redeploy across
 * the reset minute neither drops nor double-posts the message.
 */

interface ResetState {
  lastPostedDate: string;
}

const REMINDERS = [
  'Clear your daily dungeon runs before reset',
  'Spend today\'s energy — it does not bank',
  'Claim daily quest + guild rewards',
  'Hit your guild boss attempts',
  'Free summons and shop freebies reset now',
];

function todayKey(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}

async function postReset(ctx: BotContext): Promise<void> {
  const guild = getHomeGuild(ctx);
  if (!guild) return;
  const store = ctx.stores.store<ResetState>('daily-reset', { lastPostedDate: '' });
  const key = todayKey(ctx.guild.dailyReset.timezone);
  const state = await store.get();
  if (state.lastPostedDate === key) return;

  const sent = await sendToChannel(
    guild,
    ctx.guild.channels.general,
    {
      embeds: [
        stormEmbed(
          `🌀 ${ctx.guild.identity.gameName} — Daily Reset!`,
          [
            'A new game day just started. Quick checklist:',
            '',
            ...REMINDERS.map((r) => `• ${r}`),
            '',
            `Good luck out there, ${ctx.guild.identity.guildName}! ⛈️`,
          ].join('\n'),
        ),
      ],
    },
    ctx.logger.child('daily-reset'),
  );
  if (sent) await store.set({ lastPostedDate: key });
}

const resetNow = {
  data: new SlashCommandBuilder()
    .setName('reset-post')
    .setDescription('Post the daily reset message now (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
  async execute(interaction: import('discord.js').ChatInputCommandInteraction, ctx: BotContext) {
    await ctx.stores.store<ResetState>('daily-reset', { lastPostedDate: '' }).set({ lastPostedDate: '' });
    await postReset(ctx);
    await interaction.reply({ content: 'Daily reset message posted.', ephemeral: true });
  },
};

export function dailyResetFeature(): FeatureModule {
  return {
    name: 'daily-reset',
    commands: [resetNow],
    jobs: [
      {
        name: 'post-reset',
        cron: `0 ${guildConfig.dailyReset.hour} * * *`,
        timezone: guildConfig.dailyReset.timezone,
        run: postReset,
      },
    ],
  };
}
