/**
 * Idempotent server bootstrap: creates the roles and channels the bot's
 * guild config expects, with sensible permissions. Safe to re-run — it
 * only creates what's missing and never deletes.
 *
 *   npm run setup:server           # apply
 *   npm run setup:server -- --dry-run
 */
import {
  ChannelType,
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type Role,
} from 'discord.js';
import { loadConfig } from '../config/env.js';
import { guildConfig, type RoleRef } from '../config/guild.js';

const dryRun = process.argv.includes('--dry-run');
const actions: string[] = [];

function plan(action: string): boolean {
  actions.push(`${dryRun ? '[dry-run] ' : ''}${action}`);
  console.log(actions[actions.length - 1]);
  return !dryRun;
}

async function ensureRole(guild: Guild, ref: RoleRef, color?: number): Promise<Role | undefined> {
  const existing = guild.roles.cache.find((r) => r.name === ref.name);
  if (existing) return existing;
  if (!plan(`create role "${ref.name}"`)) return undefined;
  return guild.roles.create({ name: ref.name, ...(color !== undefined ? { color } : {}), reason: 'Tempest bot setup' });
}

async function ensureCategory(
  guild: Guild,
  name: string,
  /** When set, the whole category (and channels that sync to it) is hidden from @everyone. */
  restrictToRoles?: Role[],
): Promise<CategoryChannel | undefined> {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name,
  ) as CategoryChannel | undefined;
  if (existing) return existing;
  if (!plan(`create category "${name}"${restrictToRoles ? ' (private)' : ''}`)) return undefined;

  const overwrites = [];
  if (restrictToRoles && restrictToRoles.length > 0) {
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
    for (const role of restrictToRoles) {
      overwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel] });
    }
    if (guild.members.me) {
      overwrites.push({ id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel] });
    }
  }
  return guild.channels.create({ name, type: ChannelType.GuildCategory, permissionOverwrites: overwrites });
}

interface ChannelSpec {
  name: string;
  topic: string;
  /** null → visible to everyone; list → only these roles (+bot) can view. */
  restrictToRoles: Role[] | null;
  /** Everyone can read but not send (announcements). */
  readOnly?: boolean;
}

async function ensureTextChannel(
  guild: Guild,
  category: CategoryChannel | undefined,
  spec: ChannelSpec,
): Promise<void> {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === spec.name,
  );
  if (existing) return;
  if (!plan(`create #${spec.name}${spec.restrictToRoles ? ' (restricted)' : ''}${spec.readOnly ? ' (read-only)' : ''}`)) return;

  const overwrites = [];
  if (spec.restrictToRoles) {
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
    for (const role of spec.restrictToRoles) {
      overwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel] });
    }
    if (guild.members.me) {
      overwrites.push({ id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel] });
    }
  } else if (spec.readOnly) {
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] });
    if (guild.members.me) {
      overwrites.push({ id: guild.members.me.id, allow: [PermissionFlagsBits.SendMessages] });
    }
  }

  await guild.channels.create({
    name: spec.name,
    type: ChannelType.GuildText,
    ...(category ? { parent: category.id } : {}),
    topic: spec.topic,
    permissionOverwrites: overwrites,
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);
  const guild = await client.guilds.fetch(config.guildId);
  await guild.roles.fetch();
  await guild.channels.fetch();
  console.log(`Setting up "${guild.name}" (${guild.id})${dryRun ? ' — DRY RUN' : ''}\n`);

  const g = guildConfig;
  const STORM_BLUE = 0x4aa8d8;
  const GOLD = 0xf1c40f;

  // Roles — order matters for the sidebar (created top-down here).
  const admin = await ensureRole(guild, g.roles.admin, 0xe74c3c);
  const officer = await ensureRole(guild, g.roles.officer, 0xe67e22);
  const guildMember = await ensureRole(guild, g.roles.guildMember, STORM_BLUE);
  await ensureRole(guild, g.roles.aiEnabled, 0x9b59b6);
  for (const tier of [...g.contributionTiers].reverse()) await ensureRole(guild, tier.role, GOLD);
  for (const tier of [...g.activityTiers].reverse()) await ensureRole(guild, tier.role, 0x3498db);
  await ensureRole(guild, g.roles.member, 0x95a5a6);

  // Community category
  const community = await ensureCategory(guild, '⛈️ TEMPEST');
  await ensureTextChannel(guild, community, {
    name: g.channels.general.name,
    topic: `Welcome to ${g.identity.guildName}! General chat — daily reset reminders land here.`,
    restrictToRoles: null,
  });
  await ensureTextChannel(guild, community, {
    name: g.channels.lobby.name,
    topic: 'The lobby — hang out, talk Wittle Defender, meet players from partner servers.',
    restrictToRoles: null,
  });
  await ensureTextChannel(guild, community, {
    name: g.channels.aiChat.name,
    topic: `Ask Tempest AI anything about ${g.identity.gameName} — builds, heroes, runes. Teach it with /fact add.`,
    restrictToRoles: null,
  });
  await ensureTextChannel(guild, community, {
    name: g.channels.recruiting.name,
    topic: `Join ${g.identity.guildName}! ${g.identity.requiredPower}+ power, daily active. /guild apply`,
    restrictToRoles: null,
  });

  // Guild-only category — PRIVATE at the category level (hidden from non-members).
  // Note: #recruiting deliberately lives in the PUBLIC community category above,
  // not here — recruiting only works if everyone can see it.
  const restricted = [guildMember, officer, admin].filter((r): r is Role => Boolean(r));
  const guildOnly = await ensureCategory(
    guild,
    '⚔️ GUILD HALL',
    restricted.length > 0 ? restricted : undefined,
  );
  await ensureTextChannel(guild, guildOnly, {
    name: g.channels.guildHall.name,
    topic: 'Guild members only — strategy, boss timing, and shenanigans.',
    restrictToRoles: restricted.length > 0 ? restricted : null,
  });

  // System category
  const system = await ensureCategory(guild, '🤖 SYSTEM');
  await ensureTextChannel(guild, system, {
    name: g.channels.changelog.name,
    topic: 'Bot release notes — posted automatically on every deploy.',
    restrictToRoles: null,
    readOnly: true,
  });
  const staff = [officer, admin].filter((r): r is Role => Boolean(r));
  await ensureTextChannel(guild, system, {
    name: g.channels.botLogs.name,
    topic: 'Bot deploy notices, warnings, errors, and memory-sync reports.',
    restrictToRoles: staff.length > 0 ? staff : null,
  });

  console.log(`\nDone. ${actions.length === 0 ? 'Nothing to do — server already matches config.' : `${actions.length} action(s)${dryRun ? ' planned' : ' applied'}.`}`);
  await client.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
