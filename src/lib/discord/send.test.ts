import { describe, expect, it, vi } from 'vitest';
import type { Guild } from 'discord.js';
import { createLogger } from '../../core/logger.js';
import { deleteMessageById } from './send.js';

const log = createLogger('error');

/** Minimal Guild stub exposing just the channel/message lookups we use. */
function guildWith(opts: {
  channel?: { isTextBased: boolean; fetchMessage?: () => Promise<unknown> };
} = {}) {
  const del = vi.fn(async () => undefined);
  const channel = opts.channel
    ? {
        isTextBased: () => opts.channel!.isTextBased,
        messages: {
          fetch: opts.channel!.fetchMessage ?? (async () => ({ delete: del })),
        },
      }
    : undefined;
  const guild = {
    channels: {
      cache: new Map(channel ? [['c1', channel]] : []),
      fetch: async () => channel ?? null,
    },
  } as unknown as Guild;
  return { guild, del };
}

describe('deleteMessageById', () => {
  it('deletes the message and reports success', async () => {
    const { guild, del } = guildWith({ channel: { isTextBased: true } });
    expect(await deleteMessageById(guild, 'c1', 'm1', log)).toBe(true);
    expect(del).toHaveBeenCalledOnce();
  });

  it('is a no-op when there is no stored id yet (first ever post)', async () => {
    const { guild, del } = guildWith({ channel: { isTextBased: true } });
    expect(await deleteMessageById(guild, 'c1', undefined, log)).toBe(false);
    expect(await deleteMessageById(guild, undefined, 'm1', log)).toBe(false);
    expect(del).not.toHaveBeenCalled();
  });

  it('treats an already-deleted message as normal, not an error', async () => {
    const notFound = Object.assign(new Error('Unknown Message'), { code: 10008 });
    const { guild } = guildWith({
      channel: { isTextBased: true, fetchMessage: async () => Promise.reject(notFound) },
    });
    // Must resolve false rather than throw — someone deleting it by hand is expected.
    await expect(deleteMessageById(guild, 'c1', 'm1', log)).resolves.toBe(false);
  });

  it('swallows unexpected failures so cleanup never blocks posting', async () => {
    const boom = Object.assign(new Error('Missing Permissions'), { code: 50013 });
    const { guild } = guildWith({
      channel: { isTextBased: true, fetchMessage: async () => Promise.reject(boom) },
    });
    await expect(deleteMessageById(guild, 'c1', 'm1', log)).resolves.toBe(false);
  });

  it('returns false when the channel is gone', async () => {
    const { guild } = guildWith({});
    expect(await deleteMessageById(guild, 'c1', 'm1', log)).toBe(false);
  });

  it('returns false for a non-text channel', async () => {
    const { guild } = guildWith({ channel: { isTextBased: false } });
    expect(await deleteMessageById(guild, 'c1', 'm1', log)).toBe(false);
  });
});
