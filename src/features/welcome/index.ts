import type { GuildMember } from 'discord.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { defineEvent } from '../../core/types.js';
import { resolveRole, resolveTextChannel } from '../../lib/discord/resolve.js';
import { sendToChannel, stormEmbed } from '../../lib/discord/send.js';

interface WelcomeState {
  /** Member ids already welcomed, so a rejoin or gateway replay doesn't double-post. */
  welcomed: string[];
}

const MAX_TRACKED = 1000;

function channelMention(ctx: BotContext, member: GuildMember, ref: { name: string; id?: string }): string {
  const channel = resolveTextChannel(member.guild, ref);
  return channel ? `<#${channel.id}>` : `#${ref.name}`;
}

async function handleJoin(ctx: BotContext, member: GuildMember): Promise<void> {
  const log = ctx.logger.child('welcome');
  const store = ctx.stores.store<WelcomeState>('welcome', { welcomed: [] });
  const state = await store.get();
  if (state.welcomed.includes(member.id)) return;
  await store.update((s) => {
    s.welcomed.push(member.id);
    if (s.welcomed.length > MAX_TRACKED) s.welcomed = s.welcomed.slice(-MAX_TRACKED);
    return s;
  });

  const { identity } = ctx.guild;

  // Each step is independent — a failure in one never blocks the others.
  try {
    const role = resolveRole(member.guild, ctx.guild.roles.member);
    if (role) await member.roles.add(role);
    else log.warn(`Member role "${ctx.guild.roles.member.name}" not found`);
  } catch (error) {
    log.error('Failed to auto-assign member role', error);
  }

  await sendToChannel(
    member.guild,
    ctx.guild.channels.general,
    {
      embeds: [
        stormEmbed(
          `⛈️ Welcome to ${identity.guildName}, ${member.displayName}!`,
          [
            `Glad you found us, <@${member.id}> — this is the ${identity.guildName} hub for **${identity.gameName}**.`,
            '',
            `💬 Hang out in ${channelMention(ctx, member, ctx.guild.channels.lobby)}`,
            `🤖 Ask the AI anything about the game in ${channelMention(ctx, member, ctx.guild.channels.aiChat)}`,
            `⚔️ Want to join the **${identity.guildName}** guild in game? See ${channelMention(ctx, member, ctx.guild.channels.recruiting)} — we recruit daily-active players at ${identity.requiredPower}+ power.`,
          ].join('\n'),
        ).setThumbnail(member.user.displayAvatarURL()),
      ],
    },
    log,
  );

  try {
    await member.send({
      embeds: [
        stormEmbed(
          `Welcome to the ${identity.guildName} server! ⛈️`,
          [
            `Hey ${member.displayName}! I'm ${identity.botName}.`,
            '',
            '**Getting started**',
            '• `/help` shows everything I can do',
            '• `/rank` tracks your activity as you chat',
            `• The AI channel answers ${identity.gameName} questions — builds, heroes, runes, all of it`,
            '',
            `**Joining the ${identity.guildName} guild in game**`,
            `• Requirement: ${identity.requiredPower}+ power and daily activity`,
            `• Guild leader: **${identity.guildLeader}**`,
            '• Run `/guild apply` in the server and an officer will get you in.',
          ].join('\n'),
        ),
      ],
    });
  } catch {
    log.debug(`Could not DM ${member.user.tag} (DMs likely closed)`);
  }
}

export function welcomeFeature(): FeatureModule {
  return {
    name: 'welcome',
    events: [
      defineEvent({
        event: 'guildMemberAdd',
        handler: (ctx, member) => handleJoin(ctx, member),
      }),
    ],
  };
}
