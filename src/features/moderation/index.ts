import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { safeDm } from '../../lib/discord/dm.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { memberHasAnyRole, resolveRole } from '../../lib/discord/resolve.js';
import { COLORS, sendToChannel, stormEmbed } from '../../lib/discord/send.js';
import {
  canRunAction,
  canTargetMember,
  parseDuration,
  type ActorContext,
  type ModAction,
} from './permissions.js';

/**
 * Moderation tools for admins and officers: roles, timeouts, kicks and bans.
 *
 * Before this, staff had no way to act through the bot at all. The permission
 * logic lives in permissions.ts and is unit-tested — this file is only the
 * Discord plumbing around it.
 *
 * Every action is announced in #bot-logs. Discord keeps its own audit log, but
 * that requires opening server settings; a channel post is what actually gets
 * noticed, and it makes staff accountable to each other.
 */

function actorContext(interaction: ChatInputCommandInteraction, ctx: BotContext): ActorContext {
  const isOwner = interaction.user.id === ctx.config.ownerId;
  if (!interaction.inCachedGuild()) return { isOwner, isAdmin: false, isOfficer: false };
  return {
    isOwner,
    isAdmin:
      memberHasAnyRole(interaction.member, [ctx.guild.roles.admin]) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator),
    isOfficer: memberHasAnyRole(interaction.member, [ctx.guild.roles.officer]),
  };
}

/** Post every action to #bot-logs so staff decisions are visible to staff. */
async function logAction(
  ctx: BotContext,
  fields: { action: string; actor: string; target: string; reason: string; detail?: string },
): Promise<void> {
  const guild = getHomeGuild(ctx);
  if (!guild) return;
  await sendToChannel(
    guild,
    ctx.guild.channels.botLogs,
    {
      embeds: [
        stormEmbed(
          `🛡️ ${fields.action}`,
          [
            `**Target:** ${fields.target}`,
            `**By:** ${fields.actor}`,
            fields.detail ? `**Details:** ${fields.detail}` : null,
            `**Reason:** ${fields.reason}`,
          ]
            .filter(Boolean)
            .join('\n'),
        ).setColor(COLORS.warning),
      ],
      allowedMentions: { parse: [] },
    },
    ctx.logger.child('moderation'),
  );
}

/** Shared gate: permission, then whether this target may be actioned. */
async function guardAction(
  interaction: ChatInputCommandInteraction,
  ctx: BotContext,
  action: ModAction,
  target: GuildMember | null,
): Promise<boolean> {
  const actor = actorContext(interaction, ctx);
  if (!canRunAction(actor, action)) {
    await interaction.reply({
      content:
        actor.isOfficer && !actor.isAdmin
          ? 'That one is admin-only — officers can manage roles and timeouts.'
          : 'You do not have permission to do that.',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  if (!target || !interaction.inCachedGuild()) return true;

  const check = canTargetMember({
    actorId: interaction.user.id,
    targetId: target.id,
    ownerId: ctx.config.ownerId,
    guildOwnerId: interaction.guild.ownerId,
    actorTopRole: interaction.member.roles.highest.position,
    targetTopRole: target.roles.highest.position,
    botTopRole: interaction.guild.members.me?.roles.highest.position ?? 0,
    targetIsBot: target.user.bot,
    actorIsOwner: actor.isOwner,
  });
  if (!check.ok) {
    await interaction.reply({ content: check.reason, flags: MessageFlags.Ephemeral });
    return false;
  }
  return true;
}

const modCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation tools (officers and admins)')
    // Hides the command from members who cannot use it. The real checks are
    // below — this is presentation, not security.
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) =>
      s
        .setName('role')
        .setDescription('Add or remove a role')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
        .addStringOption((o) => o.setName('role').setDescription('Role name').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('action')
            .setDescription('Add or remove')
            .setRequired(true)
            .setChoices({ name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }),
        )
        .addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(300)),
    )
    .addSubcommand((s) =>
      s
        .setName('timeout')
        .setDescription('Temporarily mute a member')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
        .addStringOption((o) =>
          o.setName('duration').setDescription('e.g. 30m, 2h, 7d (max 28d)').setRequired(true),
        )
        .addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(300)),
    )
    .addSubcommand((s) =>
      s
        .setName('untimeout')
        .setDescription('Lift a timeout early')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(300)),
    )
    .addSubcommand((s) =>
      s
        .setName('kick')
        .setDescription('Admin: remove a member (they can rejoin)')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(300)),
    )
    .addSubcommand((s) =>
      s
        .setName('ban')
        .setDescription('Admin: ban a member')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(300))
        .addIntegerOption((o) =>
          o
            .setName('delete_days')
            .setDescription("Delete this member's recent messages (0-7 days)")
            .setMinValue(0)
            .setMaxValue(7),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('unban')
        .setDescription('Admin: lift a ban')
        .addStringOption((o) => o.setName('user_id').setDescription('User ID').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(300)),
    )
    .toJSON(),

  async execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand() as ModAction;
    const reason = interaction.options.getString('reason') ?? 'No reason given';
    const auditReason = `${reason} — by ${interaction.user.tag}`;
    const log = ctx.logger.child('moderation');

    // unban takes an id, not a member: the user is not in the guild.
    if (sub === 'unban') {
      if (!(await guardAction(interaction, ctx, 'unban', null))) return;
      const userId = interaction.options.getString('user_id', true).trim();
      try {
        await interaction.guild.bans.remove(userId, auditReason);
      } catch (error) {
        log.warn(`Unban failed for ${userId}`, error);
        await interaction.reply({
          content: 'Could not unban that ID — check it is correct and that they are actually banned.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({ content: `Unbanned \`${userId}\`.`, flags: MessageFlags.Ephemeral });
      await logAction(ctx, { action: 'Unban', actor: `<@${interaction.user.id}>`, target: `\`${userId}\``, reason });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const target = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!target) {
      await interaction.reply({ content: 'That member is not in this server.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (!(await guardAction(interaction, ctx, sub, target))) return;

    try {
      switch (sub) {
        case 'role': {
          const roleName = interaction.options.getString('role', true);
          const add = interaction.options.getString('action', true) === 'add';
          const role = resolveRole(interaction.guild, { name: roleName });
          if (!role) {
            await interaction.reply({ content: `No role called "${roleName}".`, flags: MessageFlags.Ephemeral });
            return;
          }
          // A role at or above the bot cannot be assigned, same hierarchy rule.
          const botTop = interaction.guild.members.me?.roles.highest.position ?? 0;
          if (role.position >= botTop) {
            await interaction.reply({
              content: `**${role.name}** sits above the bot in the role list, so I can't assign it. Move my role higher.`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          if (add) await target.roles.add(role, auditReason);
          else await target.roles.remove(role, auditReason);
          await interaction.reply({
            content: `${add ? 'Added' : 'Removed'} **${role.name}** ${add ? 'to' : 'from'} ${target.user.tag}.`,
            flags: MessageFlags.Ephemeral,
          });
          await logAction(ctx, {
            action: add ? 'Role added' : 'Role removed',
            actor: `<@${interaction.user.id}>`,
            target: `<@${target.id}>`,
            detail: role.name,
            reason,
          });
          return;
        }

        case 'timeout': {
          const parsed = parseDuration(interaction.options.getString('duration', true));
          if (!parsed.ok) {
            await interaction.reply({ content: parsed.reason, flags: MessageFlags.Ephemeral });
            return;
          }
          await target.timeout(parsed.minutes * 60_000, auditReason);
          await interaction.reply({
            content: `Timed out ${target.user.tag} for ${parsed.minutes} minute(s).`,
            flags: MessageFlags.Ephemeral,
          });
          // Public action AND a DM — additive, never either/or.
          await safeDm(
            ctx,
            target.id,
            stormEmbed(
              '⏳ You have been timed out',
              `You can't send messages in **${interaction.guild.name}** for ${parsed.minutes} minute(s).\n\n**Reason:** ${reason}`,
            ).setColor(COLORS.warning),
          );
          await logAction(ctx, {
            action: 'Timeout',
            actor: `<@${interaction.user.id}>`,
            target: `<@${target.id}>`,
            detail: `${parsed.minutes} minute(s)`,
            reason,
          });
          return;
        }

        case 'untimeout': {
          await target.timeout(null, auditReason);
          await interaction.reply({ content: `Lifted the timeout on ${target.user.tag}.`, flags: MessageFlags.Ephemeral });
          await logAction(ctx, {
            action: 'Timeout lifted',
            actor: `<@${interaction.user.id}>`,
            target: `<@${target.id}>`,
            reason,
          });
          return;
        }

        case 'kick':
        case 'ban': {
          // DM before removing them — afterwards the bot shares no server with
          // them and the DM will silently fail.
          await safeDm(
            ctx,
            target.id,
            stormEmbed(
              sub === 'ban' ? '🔨 You have been banned' : '👋 You have been removed',
              `From **${interaction.guild.name}**.\n\n**Reason:** ${reason}` +
                (sub === 'kick' ? '\n\nYou can rejoin with a new invite.' : ''),
            ).setColor(COLORS.danger),
          );
          if (sub === 'ban') {
            const days = interaction.options.getInteger('delete_days') ?? 0;
            await interaction.guild.bans.create(target.id, {
              reason: auditReason,
              deleteMessageSeconds: days * 86_400,
            });
          } else {
            await target.kick(auditReason);
          }
          await interaction.reply({
            content: `${sub === 'ban' ? 'Banned' : 'Kicked'} ${target.user.tag}.`,
            flags: MessageFlags.Ephemeral,
          });
          await logAction(ctx, {
            action: sub === 'ban' ? 'Ban' : 'Kick',
            actor: `<@${interaction.user.id}>`,
            target: `${target.user.tag} (\`${target.id}\`)`,
            reason,
          });
          return;
        }
      }
    } catch (error) {
      log.error(`Moderation action "${sub}" failed`, error);
      const body = { content: 'That failed — check my role is above theirs and that I have the right permissions.', flags: MessageFlags.Ephemeral } as const;
      if (interaction.replied || interaction.deferred) await interaction.followUp(body);
      else await interaction.reply(body);
    }
  },
};

export function moderationFeature(): FeatureModule {
  return { name: 'moderation', commands: [modCommand] };
}
