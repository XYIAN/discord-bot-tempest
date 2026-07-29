import { SlashCommandBuilder, type ChatInputCommandInteraction, type Message } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { defineEvent } from '../../core/types.js';
import { getUserAchievements, recordMessage } from '../../lib/achievements/service.js';
import { isHumanGuildMessage } from '../../lib/discord/message.js';
import { stormEmbed } from '../../lib/discord/send.js';

async function onMessage(ctx: BotContext, message: Message): Promise<void> {
  if (!isHumanGuildMessage(message, ctx.config.guildId)) return;
  await recordMessage(ctx, message.author.id);
}

const achievements = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('Your unlocked achievements')
    .addUserOption((o) => o.setName('user').setDescription('View someone else').setRequired(false))
    .toJSON(),
  async execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const { unlocked, locked } = await getUserAchievements(ctx, target.id);
    const lines = [
      ...unlocked.map((a) => `${a.emoji} **${a.name}** — ${a.description}`),
      ...locked.map((a) => `🔒 ~~${a.name}~~ — ${a.description}`),
    ];
    await interaction.reply({
      embeds: [
        stormEmbed(
          `${target.displayName}'s achievements (${unlocked.length}/${unlocked.length + locked.length})`,
          lines.join('\n'),
        ),
      ],
    });
  },
};

export function achievementsFeature(): FeatureModule {
  return {
    name: 'achievements',
    commands: [achievements],
    events: [defineEvent({ event: 'messageCreate', handler: onMessage })],
  };
}
