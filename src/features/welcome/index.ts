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
  // The bot can sit in partner servers for the lobby relay — only welcome
  // joins to the home guild.
  if (member.guild.id !== ctx.config.guildId) return;
  const log = ctx.logger.child('welcome');

  // Role grants run on EVERY join (idempotent): a rejoining member lost
  // their roles on leave and must get them back even if already welcomed.
  for (const ref of [ctx.guild.roles.member, ctx.guild.roles.aiEnabled]) {
    try {
      const role = resolveRole(member.guild, ref);
      if (role) await member.roles.add(role);
      else log.warn(`Role "${ref.name}" not found`);
    } catch (error) {
      log.error(`Failed to auto-assign role "${ref.name}"`, error);
    }
  }

  // Dedupe (welcome post + DM only) — membership check and insert happen
  // atomically inside one update so gateway replays can't double-post.
  const store = ctx.stores.store<WelcomeState>('welcome', { welcomed: [] });
  let alreadyWelcomed = false;
  await store.update((s) => {
    if (s.welcomed.includes(member.id)) {
      alreadyWelcomed = true;
    } else {
      s.welcomed.push(member.id);
      if (s.welcomed.length > MAX_TRACKED) s.welcomed = s.welcomed.slice(-MAX_TRACKED);
    }
    return s;
  });
  if (alreadyWelcomed) return;

  const { identity } = ctx.guild;

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
