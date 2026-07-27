import { SlashCommandBuilder } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { COLORS, stormEmbed } from '../../lib/discord/send.js';

/** Operational plumbing: /ping and /help. Deploy notices live in the releases feature. */

const ping = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Bot status check').toJSON(),
  async execute(interaction: import('discord.js').ChatInputCommandInteraction, ctx: BotContext) {
    await interaction.reply({
      embeds: [
        stormEmbed('Pong! ⛈️').addFields(
          { name: 'Latency', value: `${Date.now() - interaction.createdTimestamp}ms`, inline: true },
          { name: 'Uptime', value: `${Math.floor(process.uptime() / 60)} min`, inline: true },
          { name: 'Guild', value: ctx.guild.identity.guildName, inline: true },
        ),
      ],
    });
  },
};

const help = {
  data: new SlashCommandBuilder().setName('help').setDescription('What Tempest Bot can do').toJSON(),
  async execute(interaction: import('discord.js').ChatInputCommandInteraction, ctx: BotContext) {
    const { identity } = ctx.guild;
    await interaction.reply({
      embeds: [
        stormEmbed(
          `${identity.botName} — ${identity.guildName} hub for ${identity.gameName}`,
          [
            '**Community**',
            '`/rank` — your activity level and progress',
            '`/leaderboard` — most active members',
            '`/achievements` — your unlocked achievements',
            '',
            '**Guild**',
            '`/guild info` — requirements and how to join Tempest',
            '`/guild apply` — apply to join (pings the officers)',
            '',
            '**Tempest AI**',
            `Ask anything about ${identity.gameName} in the AI channel`,
            '`/fact add` — teach the AI a fact (reviewed before it sticks)',
            '`/fact list` — browse what it knows',
          ].join('\n'),
        ).setColor(COLORS.primary),
      ],
    });
  },
};

export function opsFeature(): FeatureModule {
  return {
    name: 'ops',
    commands: [ping, help],
  };
}
