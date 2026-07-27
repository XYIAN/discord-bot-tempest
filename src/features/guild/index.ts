import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { recordGuildJoin } from '../../lib/achievements/service.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { memberHasAnyRole, resolveRole, resolveTextChannel } from '../../lib/discord/resolve.js';
import { COLORS, sendToChannel, stormEmbed } from '../../lib/discord/send.js';

/**
 * Guild membership: info, applications, officer verification, and the
 * recurring recruiting post. The recruiting cadence is persisted, so
 * redeploys never reset the "every N days" clock (a real bug in the
 * reference bot).
 */

interface RecruitingState {
  lastPostedAt: number;
}

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
  const sent = await sendToChannel(
    guild,
    ctx.guild.channels.recruiting,
    { embeds: [recruitingEmbed(ctx)] },
    ctx.logger.child('guild'),
  );
  if (sent) await store.set({ lastPostedAt: Date.now() });
  return Boolean(sent);
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
      const ign = interaction.options.getString('ign', true);
      const power = interaction.options.getString('power', true);
      const guild = interaction.guild;
      if (!guild) return;
      const officerRole = resolveRole(guild, ctx.guild.roles.officer);
      const recruiting = resolveTextChannel(guild, ctx.guild.channels.recruiting);
      const embed = stormEmbed('📥 New guild application', [
        `**Applicant:** <@${interaction.user.id}>`,
        `**In-game name:** ${ign}`,
        `**Power:** ${power}`,
        '',
        'Officers: invite them in game, then run `/guild verify` to grant the guild role.',
      ].join('\n')).setColor(COLORS.warning);
      await recruiting?.send(
        officerRole
          ? { content: `<@&${officerRole.id}>`, embeds: [embed], allowedMentions: { roles: [officerRole.id] } }
          : { embeds: [embed] },
      );
      await interaction.reply({
        content: `Application sent! An officer will reach out. Make sure your in-game power is ${ctx.guild.identity.requiredPower}+ and you can play daily.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'verify') {
      if (!interaction.inCachedGuild()) return;
      const guild = interaction.guild;
      const canVerify =
        memberHasAnyRole(interaction.member, [ctx.guild.roles.officer, ctx.guild.roles.admin]) ||
        interaction.user.id === ctx.config.ownerId;
      if (!canVerify) {
        await interaction.reply({ content: 'Officers only.', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('user', true);
      const member = await guild.members.fetch(user.id);
      const role = resolveRole(guild, ctx.guild.roles.guildMember);
      if (!role) {
        await interaction.reply({ content: `Role "${ctx.guild.roles.guildMember.name}" not found on this server.`, ephemeral: true });
        return;
      }
      await member.roles.add(role);
      await recordGuildJoin(ctx, user.id);
      await interaction.reply({
        embeds: [
          stormEmbed('⚔️ Guild member verified', `<@${user.id}> is now **${ctx.guild.identity.guildName}** — welcome to the storm!`).setColor(COLORS.success),
        ],
      });
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
