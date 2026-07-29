import { describe, expect, it } from 'vitest';
import type { Message } from 'discord.js';
import { isHumanGuildMessage } from './message.js';

const GUILD = '111';

/** Minimal duck-typed message; isHumanGuildMessage only reads these fields. */
function msg(overrides: Partial<{ bot: boolean; system: boolean; guildId: string | null }>): Message {
  const guildId = overrides.guildId === undefined ? GUILD : overrides.guildId;
  return {
    author: { bot: overrides.bot ?? false },
    system: overrides.system ?? false,
    guildId,
    inGuild() {
      return guildId !== null;
    },
  } as unknown as Message;
}

describe('isHumanGuildMessage', () => {
  it('accepts a real human message in the home guild', () => {
    expect(isHumanGuildMessage(msg({}), GUILD)).toBe(true);
  });

  it('rejects system messages (the member-join notification bug)', () => {
    expect(isHumanGuildMessage(msg({ system: true }), GUILD)).toBe(false);
  });

  it('rejects bot messages', () => {
    expect(isHumanGuildMessage(msg({ bot: true }), GUILD)).toBe(false);
  });

  it('rejects DMs (no guild)', () => {
    expect(isHumanGuildMessage(msg({ guildId: null }), GUILD)).toBe(false);
  });

  it('rejects messages from other guilds', () => {
    expect(isHumanGuildMessage(msg({ guildId: '999' }), GUILD)).toBe(false);
  });
});
