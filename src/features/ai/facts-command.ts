import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { BotContext, SlashCommand } from '../../core/types.js';
import { recordFactApproved } from '../../lib/achievements/service.js';
import { safeDm } from '../../lib/discord/dm.js';
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
import { runSyncReport } from './sync-report.js';

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
  const member = await guild.members.fetch(userId).catch(() => undefined);
  if (!member) return;
  // >= plus a has-role check: a missed exact threshold (concurrent approvals,
  // deleted facts) still promotes on the next approval.
  for (const tier of ctx.guild.contributionTiers) {
    if (count < tier.threshold) continue;
    const role = resolveRole(guild, tier.role);
    if (!role || member.roles.cache.has(role.id)) continue;
    await member.roles.add(role).catch((e) => ctx.logger.child('ai').error('tier role grant failed', e));
    // Public announcement AND a personal DM — additive, never either/or.
    await interaction.followUp({
      embeds: [
        stormEmbed('🎓 Contributor rank up!', `<@${userId}> is now **${tier.role.name}** (${count} approved facts)!`).setColor(COLORS.success),
      ],
      allowedMentions: { parse: [] },
    });
    await safeDm(
      ctx,
      userId,
      stormEmbed(
        `🎓 You're now ${tier.role.name}!`,
        `Your knowledge contributions to ${ctx.guild.identity.botName} earned you the **${tier.role.name}** role (${count} approved facts). Thanks for making the AI smarter — keep them coming with \`/fact add\`!`,
      ).setColor(COLORS.success),
    );
  }
}

/** Facts are inlined into the AI prompt — keep them single-line and markdown-flat. */
function sanitizeFactText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[`#]/g, '').trim();
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
        .addIntegerOption((o) => o.setName('id').setDescription('Fact id').setRequired(true))
        .addStringOption((o) =>
          o.setName('reason').setDescription('Why (DMed to the contributor)').setMaxLength(200),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Moderator: delete a fact entirely')
        .addIntegerOption((o) => o.setName('id').setDescription('Fact id').setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName('sync').setDescription('Moderator: post the knowledge sync report + backup now'),
    )
    .toJSON(),

  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const text = sanitizeFactText(interaction.options.getString('text', true));
      const category = interaction.options.getString('category') ?? 'general';
      if (text.length < 5) {
        await interaction.reply({ content: 'That fact is too short.', flags: MessageFlags.Ephemeral });
        return;
      }
      const state = await knowledgeStore(ctx).get();
      if (isDuplicate(state, text)) {
        await interaction.reply({ content: 'The AI already knows something very similar to that.', flags: MessageFlags.Ephemeral });
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
        await interaction.reply({ content: `No ${status} facts${category ? ` in ${category}` : ''} yet.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({
        embeds: [
          stormEmbed(
            `🧠 ${status} facts${category ? ` — ${category}` : ''} (latest ${facts.length})`,
            facts.map((f) => `**#${f.id}** [${f.category}] ${f.text}`).join('\n').slice(0, 3900),
          ),
        ],
        ...(status === 'pending' ? { flags: MessageFlags.Ephemeral } : {}),
      });
      return;
    }

    // approve / reject / remove / sync — moderators only
    if (!isModerator(interaction, ctx)) {
      await interaction.reply({ content: 'Moderators only.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'sync') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const summary = await runSyncReport(ctx, true);
      await interaction.editReply({ content: summary });
      return;
    }
    const id = interaction.options.getInteger('id', true);

    if (sub === 'remove') {
      const removed = await removeFact(ctx, id);
      await interaction.reply({ content: removed ? `Fact #${id} deleted.` : `No fact #${id}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const status = sub === 'approve' ? 'approved' : 'rejected';
    const result = await setFactStatus(ctx, id, status, interaction.user.id);
    if (!result) {
      await interaction.reply({ content: `No fact #${id}.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (!result.changed) {
      await interaction.reply({ content: `Fact #${id} is already ${status}.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const fact = result.fact;
    const reason = sub === 'reject' ? interaction.options.getString('reason') : null;
    await interaction.reply({
      embeds: [
        stormEmbed(
          status === 'approved' ? '✅ Fact approved' : '🚫 Fact rejected',
          `#${fact.id} [${fact.category}] ${fact.text}${fact.addedBy ? `\nBy <@${fact.addedBy}>` : ''}${reason ? `\n**Reason:** ${reason}` : ''}`,
        ).setColor(status === 'approved' ? COLORS.success : COLORS.danger),
      ],
      allowedMentions: { parse: [] },
    });

    // DM the contributor about the review outcome — in addition to the
    // channel post above, and never when they reviewed their own fact.
    if (fact.addedBy && fact.addedBy !== interaction.user.id) {
      await safeDm(
        ctx,
        fact.addedBy,
        status === 'approved'
          ? stormEmbed(
              '✅ Your fact was approved!',
              `"${fact.text}"\n\nIt's now part of ${ctx.guild.identity.botName}'s verified knowledge. Thanks for contributing!`,
            ).setColor(COLORS.success)
          : stormEmbed(
              '🚫 Your fact was not approved',
              `"${fact.text}"${reason ? `\n\n**Reason:** ${reason}` : ''}\n\nFeel free to refine it and \`/fact add\` again.`,
            ).setColor(COLORS.danger),
      );
    }
    if (status === 'approved' && fact.addedBy) {
      await creditContributor(ctx, interaction, fact.addedBy);
    }
  },
};
