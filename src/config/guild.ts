/**
 * Server-shape configuration: every channel, role, tier, and piece of guild
 * identity the bot references lives here — never hardcoded in feature code.
 *
 * Channels/roles are matched by name first with an optional explicit id
 * override, so the config survives server renames and transfers cleanly
 * to a rebuilt server.
 */

export interface ChannelRef {
  /** Channel name to resolve (without #). */
  name: string;
  /** Explicit snowflake override; takes precedence over name lookup. */
  id?: string;
}

export interface RoleRef {
  name: string;
  id?: string;
}

export interface Tier {
  role: RoleRef;
  threshold: number;
}

export interface GuildConfig {
  identity: {
    gameName: string;
    guildName: string;
    guildLeader: string;
    requiredPower: string;
    botName: string;
  };
  channels: {
    /** Welcome messages + daily reset posts. */
    general: ChannelRef;
    /** The cross-server lobby people actually hang out in. */
    lobby: ChannelRef;
    /** Guild-member-only hangout. */
    guildHall: ChannelRef;
    /** Recruiting posts + applications. */
    recruiting: ChannelRef;
    /** Tempest AI question channel. */
    aiChat: ChannelRef;
    /** Release notes. */
    changelog: ChannelRef;
    /** Ops/debug firehose for admins. */
    botLogs: ChannelRef;
    /** Read-only: server rules. */
    rules: ChannelRef;
    /** Read-only: terms of use and privacy summary. */
    terms: ChannelRef;
  };
  roles: {
    /** Auto-assigned to everyone on join. */
    member: RoleRef;
    /** Verified in-game guild member; gates the guild-only section. */
    guildMember: RoleRef;
    officer: RoleRef;
    admin: RoleRef;
    /** Grants access to Tempest AI. */
    aiEnabled: RoleRef;
  };
  /** Activity XP ladder (messages earn points; thresholds award roles). */
  activityTiers: Tier[];
  /** Knowledge-contribution ladder (approved facts award roles). */
  contributionTiers: Tier[];
  activity: {
    pointsPerMessage: number;
    cooldownSeconds: number;
    /** Channel names that do NOT earn XP (e.g. bot-logs). */
    excludedChannels: string[];
  };
  dailyReset: {
    /** Local hour (0-23) in `timezone` when the in-game day resets. */
    hour: number;
    timezone: string;
  };
  recruiting: {
    /** Post the recruiting embed every N days. */
    intervalDays: number;
  };
}

export const guildConfig: GuildConfig = {
  identity: {
    gameName: 'Wittle Defender',
    guildName: 'Tempest',
    guildLeader: 'XYIAN',
    requiredPower: '1M',
    botName: 'Tempest Bot',
  },
  channels: {
    general: { name: 'general' },
    lobby: { name: 'lobby' },
    guildHall: { name: 'guild-hall' },
    recruiting: { name: 'recruiting' },
    aiChat: { name: 'tempest-ai' },
    changelog: { name: 'changelog' },
    botLogs: { name: 'bot-logs' },
    rules: { name: 'rules' },
    terms: { name: 'terms-and-privacy' },
  },
  roles: {
    member: { name: 'Storm Watcher' },
    guildMember: { name: 'Tempest Guild' },
    officer: { name: 'Officer' },
    admin: { name: 'Admin' },
    aiEnabled: { name: 'AI Enabled' },
  },
  activityTiers: [
    { role: { name: 'Storm Recruit' }, threshold: 25 },
    { role: { name: 'Squall Fighter' }, threshold: 100 },
    { role: { name: 'Tempest Vanguard' }, threshold: 350 },
    { role: { name: 'Stormcaller' }, threshold: 750 },
    { role: { name: 'Eye of the Storm' }, threshold: 1500 },
  ],
  contributionTiers: [
    { role: { name: 'Storm Scholar' }, threshold: 5 },
    { role: { name: 'Storm Sage' }, threshold: 15 },
  ],
  activity: {
    pointsPerMessage: 1,
    cooldownSeconds: 60,
    excludedChannels: ['bot-logs', 'changelog', 'recruiting'],
  },
  dailyReset: {
    hour: 9,
    timezone: 'America/Los_Angeles',
  },
  recruiting: {
    intervalDays: 2,
  },
};
