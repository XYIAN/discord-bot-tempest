import { ChannelType, type Guild, type GuildMember, type Role, type TextChannel } from 'discord.js';
import type { ChannelRef, RoleRef } from '../../config/guild.js';

/** Id override wins; otherwise match by name. Returns undefined when absent. */
export function resolveTextChannel(guild: Guild, ref: ChannelRef): TextChannel | undefined {
  if (ref.id) {
    const byId = guild.channels.cache.get(ref.id);
    if (byId?.type === ChannelType.GuildText) return byId;
  }
  const byName = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === ref.name,
  );
  return byName as TextChannel | undefined;
}

export function resolveRole(guild: Guild, ref: RoleRef): Role | undefined {
  if (ref.id) {
    const byId = guild.roles.cache.get(ref.id);
    if (byId) return byId;
  }
  return guild.roles.cache.find((r) => r.name === ref.name);
}

export function memberHasRole(member: GuildMember, ref: RoleRef): boolean {
  return member.roles.cache.some((r) => (ref.id ? r.id === ref.id : r.name === ref.name));
}

export function memberHasAnyRole(member: GuildMember, refs: RoleRef[]): boolean {
  return refs.some((ref) => memberHasRole(member, ref));
}
