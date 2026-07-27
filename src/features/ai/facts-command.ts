import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { BotContext, SlashCommand } from '../../core/types.js';
import { recordFactApproved } from '../../lib/achievements/service.js';
import { memberHasAnyRole, resolveRole } from '../../lib/discord/resolve.js';
import { COLORS, stormEmbed } from '../../lib/discord/send.js';
import {
  addFact,
  approvedFactCountByUser,
  CATEGORIES,
  isDuplicate,
  knowledgeStore,
  removeFact,
  setFactStatus,
} from './knowledge.js';

function isModerator(interaction: ChatInputCommandInteraction, ctx: BotContext): boolean {
  if (interaction.user.id === ctx.config.ownerId) return true;
  if (!interaction.inCachedGuild()) return false;
  return memberHasAnyRole(interaction.member, [ctx.guild.roles.officer, ctx.guild.roles.admin]);
}

/** On approval: credit the contributor, promote them if they crossed a tier. */
async function creditContributor(ctx: BotContext, interaction: ChatInputCommandInteraction, userId: string) {
  await recordFactApproved(ctx, userId);
  const count = await approvedFactCountByUser(ctx, userId);
  const guild = interaction.guild;
  if (!guild) return;
  for (const tier of ctx.guild.contributionTiers) {
    if (count === tier.threshold) {
      const role = resolveRole(guild, tier.role);
      const member = await guild.members.fetch(userId).catch(() => undefined);
      if (role && member) {
        await member.roles.add(role).catch((e) => ctx.logger.child('ai').error('tier role grant failed', e));
        await interaction.followUp({
          embeds: [
            stormEmbed('🎓 Contributor rank up!', `<@${userId}> is now **${tier.role.name}** (${count} approved facts)!`).setColor(COLORS.success),
          ],
        });
      }
    }
  }
}

export const factCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Teach and curate Tempest AI knowledge')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Teach the AI a fact (reviewed before it counts)')
        .addStringOption((o) => o.setName('text').setDescription('The fact').setRequired(true).setMaxLength(500))
        .addStringOption((o) =>
          o
            .setName('category')
            .setDescription('What it relates to')
            .setChoices(...CATEGORIES.map((c) => ({ name: c, value: c }))),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('Browse what the AI knows')
        .addStringOption((o) =>
          o
            .setName('category')
            .setDescription('Filter by category')
            .setChoices(...CATEGORIES.map((c) => ({ name: c, value: c }))),
        )
        .addStringOption((o) =>
          o.setName('status').setDescription('Filter by status (moderators)').setChoices(
            { name: 'approved', value: 'approved' },
            { name: 'pending', value: 'pending' },
          ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('approve')
        .setDescription('Moderator: approve a pending fact')
        .addIntegerOption((o) => o.setName('id').setDescription('Fact id').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('reject')
        .setDescription('Moderator: reject a pending fact')
        .addIntegerOption((o) => o.setName('id').setDescription('Fact id').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Moderator: delete a fact entirely')
        .addIntegerOption((o) => o.setName('id').setDescription('Fact id').setRequired(true)),
    )
    .toJSON(),

  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const text = interaction.options.getString('text', true).trim();
      const category = interaction.options.getString('category') ?? 'general';
      const state = await knowledgeStore(ctx).get();
      if (isDuplicate(state, text)) {
        await interaction.reply({ content: 'The AI already knows something very similar to that.', ephemeral: true });
        return;
      }
      // Moderators' facts are trusted immediately; others queue for review.
      const autoApprove = isModerator(interaction, ctx);
      const fact = await addFact(ctx, {
        text,
        category,
        status: autoApprove ? 'approved' : 'pending',
        addedBy: interaction.user.id,
        addedByName: interaction.user.username,
        source: 'command',
      });
      if (autoApprove) {
        await interaction.reply({
          embeds: [stormEmbed('📚 Fact learned', `#${fact.id} [${category}] ${text}`).setColor(COLORS.success)],
        });
        await creditContributor(ctx, interaction, interaction.user.id);
      } else {
        await interaction.reply({
          embeds: [
            stormEmbed('📥 Fact submitted for review', `#${fact.id} [${category}] ${text}\n\nA moderator will review it with \`/fact approve ${fact.id}\`.`).setColor(COLORS.warning),
          ],
        });
      }
      return;
    }

    if (sub === 'list') {
      const category = interaction.options.getString('category');
      const status = interaction.options.getString('status') ?? 'approved';
      const state = await knowledgeStore(ctx).get();
      const facts = state.facts
        .filter((f) => f.status === status && (!category || f.category === category))
        .slice(-25);
      if (facts.length === 0) {
        await interaction.reply({ content: `No ${status} facts${category ? ` in ${category}` : ''} yet.`, ephemeral: true });
        return;
      }
      await interaction.reply({
        embeds: [
          stormEmbed(
            `🧠 ${status} facts${category ? ` — ${category}` : ''} (latest ${facts.length})`,
            facts.map((f) => `**#${f.id}** [${f.category}] ${f.text}`).join('\n').slice(0, 3900),
          ),
        ],
        ephemeral: status === 'pending',
      });
      return;
    }

    // approve / reject / remove — moderators only
    if (!isModerator(interaction, ctx)) {
      await interaction.reply({ content: 'Moderators only.', ephemeral: true });
      return;
    }
    const id = interaction.options.getInteger('id', true);

    if (sub === 'remove') {
      const removed = await removeFact(ctx, id);
      await interaction.reply({ content: removed ? `Fact #${id} deleted.` : `No fact #${id}.`, ephemeral: true });
      return;
    }

    const status = sub === 'approve' ? 'approved' : 'rejected';
    const fact = await setFactStatus(ctx, id, status, interaction.user.id);
    if (!fact) {
      await interaction.reply({ content: `No fact #${id}.`, ephemeral: true });
      return;
    }
    await interaction.reply({
      embeds: [
        stormEmbed(
          status === 'approved' ? '✅ Fact approved' : '🚫 Fact rejected',
          `#${fact.id} [${fact.category}] ${fact.text}${fact.addedBy ? `\nBy <@${fact.addedBy}>` : ''}`,
        ).setColor(status === 'approved' ? COLORS.success : COLORS.danger),
      ],
    });
    if (status === 'approved' && fact.addedBy) {
      await creditContributor(ctx, interaction, fact.addedBy);
    }
  },
};
