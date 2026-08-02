import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { recordGuildJoin } from '../../lib/achievements/service.js';
import { safeDm } from '../../lib/discord/dm.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { memberHasAnyRole, resolveRole, resolveTextChannel } from '../../lib/discord/resolve.js';
import { COLORS, deleteMessageById, sendToChannel, stormEmbed } from '../../lib/discord/send.js';

/**
 * Guild membership: info, applications, officer verification, and the
 * recurring recruiting post. The recruiting cadence is persisted, so
 * redeploys never reset the "every N days" clock (a real bug in the
 * reference bot).
 */

interface RecruitingState {
  lastPostedAt: number;
  /** The recruiting post currently up, so the next cycle replaces it instead of stacking. */
  lastMessageId?: string;
  /** Stored alongside the id — the configured recruiting channel can change. */
  lastChannelId?: string;
}

const APPLY_COOLDOWN_MS = 15 * 60 * 1000;
const applyCooldowns = new Map<string, number>();

function recruitingEmbed(ctx: BotContext) {
  const { identity } = ctx.guild;
  return stormEmbed(
    `⛈️ ${identity.guildName} is recruiting!`,
    [
      `**${identity.gameName}** guild looking for daily-active players who love theorycrafting builds and helping the team.`,
      '',
      `• **Requirement:** ${identity.requiredPower}+ power`,
      '• **Activity:** daily play expected',
      `• **Leader:** ${identity.guildLeader}`,
      '',
      'We run an AI-powered knowledge hub, achievements, and a friendly cross-server lobby.',
      'Use `/guild apply` and an officer will get back to you fast.',
    ].join('\n'),
  ).setColor(COLORS.primary);
}

async function postRecruiting(ctx: BotContext, force = false): Promise<boolean> {
  const guild = getHomeGuild(ctx);
  if (!guild) return false;
  const store = ctx.stores.store<RecruitingState>('recruiting', { lastPostedAt: 0 });
  const state = await store.get();
  const intervalMs = ctx.guild.recruiting.intervalDays * 24 * 60 * 60 * 1000;
  if (!force && Date.now() - state.lastPostedAt < intervalMs) return false;
  const log = ctx.logger.child('guild');
  const sent = await sendToChannel(
    guild,
    ctx.guild.channels.recruiting,
    { embeds: [recruitingEmbed(ctx)] },
    log,
  );
  if (!sent) return false;

  // Replace rather than accumulate. Deliberately post-then-delete, not
  // delete-then-post: if the send fails the old post stays up, so the channel
  // is never left with no recruiting message at all. The brief overlap is a
  // better failure mode than a gap that lasts until the next interval.
  // Only the recurring post is tracked by id, so `/guild apply` submissions in
  // the same channel are never touched.
  if (await deleteMessageById(guild, state.lastChannelId, state.lastMessageId, log)) {
    log.info('Replaced the previous recruiting post');
  }

  await store.set({
    lastPostedAt: Date.now(),
    lastMessageId: sent.id,
    lastChannelId: sent.channelId,
  });
  return true;
}

const guildCommand = {
  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Tempest guild membership')
    .addSubcommand((s) => s.setName('info').setDescription('Requirements and how to join'))
    .addSubcommand((s) =>
      s
        .setName('apply')
        .setDescription('Apply to join the Tempest guild')
        .addStringOption((o) =>
          o.setName('ign').setDescription('Your in-game name').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('power').setDescription('Your current power (e.g. 1.2M)').setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('verify')
        .setDescription('Officer: verify a member as in the guild')
        .addUserOption((o) => o.setName('user').setDescription('Member to verify').setRequired(true)),
    )
    .toJSON(),
  async execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'info') {
      await interaction.reply({ embeds: [recruitingEmbed(ctx)] });
      return;
    }

    if (sub === 'apply') {
      const ign = interaction.options.getString('ign', true).slice(0, 50);
      const power = interaction.options.getString('power', true).slice(0, 20);
      const guild = interaction.guild;
      if (!guild) return;

      // Throwaway rate-limit map: one application ping per user per 15 min.
      const lastApply = applyCooldowns.get(interaction.user.id) ?? 0;
      if (Date.now() - lastApply < APPLY_COOLDOWN_MS) {
        await interaction.reply({
          content: 'You already applied recently — give the officers a bit to respond!',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const officerRole = resolveRole(guild, ctx.guild.roles.officer);
      const recruiting = resolveTextChannel(guild, ctx.guild.channels.recruiting);
      const embed = stormEmbed('📥 New guild application', [
        `**Applicant:** <@${interaction.user.id}>`,
        `**In-game name:** ${ign}`,
        `**Power:** ${power}`,
        '',
        'Officers: invite them in game, then run `/guild verify` to grant the guild role.',
      ].join('\n')).setColor(COLORS.warning);

      let posted = false;
      if (recruiting) {
        try {
          await recruiting.send(
            officerRole
              ? { content: `<@&${officerRole.id}>`, embeds: [embed], allowedMentions: { roles: [officerRole.id] } }
              : { embeds: [embed] },
          );
          posted = true;
        } catch (error) {
          ctx.logger.child('guild').error('Failed to post application', error);
        }
      } else {
        ctx.logger.child('guild').warn(`Recruiting channel #${ctx.guild.channels.recruiting.name} not found — application dropped`);
      }

      if (posted) {
        applyCooldowns.set(interaction.user.id, Date.now());
        await interaction.reply({
          content: `Application sent! An officer will reach out. Make sure your in-game power is ${ctx.guild.identity.requiredPower}+ and you can play daily.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: 'Something went wrong sending your application — please ping an officer directly.',
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    if (sub === 'verify') {
      if (!interaction.inCachedGuild()) return;
      const guild = interaction.guild;
      const canVerify =
        memberHasAnyRole(interaction.member, [ctx.guild.roles.officer, ctx.guild.roles.admin]) ||
        interaction.user.id === ctx.config.ownerId;
      if (!canVerify) {
        await interaction.reply({ content: 'Officers only.', flags: MessageFlags.Ephemeral });
        return;
      }
      const user = interaction.options.getUser('user', true);
      const member = await guild.members.fetch(user.id);
      const role = resolveRole(guild, ctx.guild.roles.guildMember);
      if (!role) {
        await interaction.reply({ content: `Role "${ctx.guild.roles.guildMember.name}" not found on this server.`, flags: MessageFlags.Ephemeral });
        return;
      }
      await member.roles.add(role);
      await recordGuildJoin(ctx, user.id);
      // Channel announcement AND a welcome DM — additive, never either/or.
      await interaction.reply({
        embeds: [
          stormEmbed('⚔️ Guild member verified', `<@${user.id}> is now **${ctx.guild.identity.guildName}** — welcome to the storm!`).setColor(COLORS.success),
        ],
      });
      await safeDm(
        ctx,
        user.id,
        stormEmbed(
          `⚔️ Welcome to ${ctx.guild.identity.guildName}!`,
          `You're officially in the guild — the **${ctx.guild.roles.guildMember.name}** role unlocks the guild-hall section. See you in there! ⛈️`,
        ).setColor(COLORS.success),
      );
    }
  },
};

export function guildFeature(): FeatureModule {
  return {
    name: 'guild',
    commands: [guildCommand],
    jobs: [
      {
        name: 'recruiting-post',
        // Hourly check against persisted cadence: survives redeploys and
        // posts at most once per configured interval.
        cron: '0 * * * *',
        run: async (ctx) => {
          await postRecruiting(ctx);
        },
      },
    ],
  };
}
