import { describe, expect, it } from 'vitest';
import {
  canRunAction,
  canTargetMember,
  MAX_TIMEOUT_MINUTES,
  MOD_ACTIONS,
  parseDuration,
  type ActorContext,
  type TargetCheckInput,
} from './permissions.js';

const owner: ActorContext = { isOwner: true, isAdmin: false, isOfficer: false };
const admin: ActorContext = { isOwner: false, isAdmin: true, isOfficer: false };
const officer: ActorContext = { isOwner: false, isAdmin: false, isOfficer: true };
const member: ActorContext = { isOwner: false, isAdmin: false, isOfficer: false };

describe('canRunAction', () => {
  it('lets the owner and admins do everything', () => {
    for (const action of MOD_ACTIONS) {
      expect(canRunAction(owner, action)).toBe(true);
      expect(canRunAction(admin, action)).toBe(true);
    }
  });

  it('lets officers manage roles and timeouts', () => {
    expect(canRunAction(officer, 'role')).toBe(true);
    expect(canRunAction(officer, 'timeout')).toBe(true);
    expect(canRunAction(officer, 'untimeout')).toBe(true);
  });

  it('does NOT let officers kick, ban or unban', () => {
    // The whole point of the split: a compromised officer account cannot
    // remove people from the server.
    expect(canRunAction(officer, 'kick')).toBe(false);
    expect(canRunAction(officer, 'ban')).toBe(false);
    expect(canRunAction(officer, 'unban')).toBe(false);
  });

  it('lets ordinary members do nothing at all', () => {
    for (const action of MOD_ACTIONS) expect(canRunAction(member, action)).toBe(false);
  });
});

const base: TargetCheckInput = {
  actorId: 'actor',
  targetId: 'target',
  ownerId: 'botowner',
  guildOwnerId: 'guildowner',
  actorTopRole: 10,
  targetTopRole: 5,
  botTopRole: 20,
  targetIsBot: false,
  actorIsOwner: false,
};

describe('canTargetMember', () => {
  it('allows acting on someone below you', () => {
    expect(canTargetMember(base)).toEqual({ ok: true });
  });

  it('refuses self-moderation', () => {
    const r = canTargetMember({ ...base, targetId: 'actor' });
    expect(r.ok).toBe(false);
  });

  it('protects the server owner and the bot owner', () => {
    expect(canTargetMember({ ...base, targetId: 'guildowner' }).ok).toBe(false);
    expect(canTargetMember({ ...base, targetId: 'botowner' }).ok).toBe(false);
  });

  it('refuses to action bots', () => {
    expect(canTargetMember({ ...base, targetIsBot: true }).ok).toBe(false);
  });

  it('refuses a target at or above the actor, not just above', () => {
    expect(canTargetMember({ ...base, targetTopRole: 10 }).ok).toBe(false);
    expect(canTargetMember({ ...base, targetTopRole: 11 }).ok).toBe(false);
  });

  it('exempts the bot owner from the peer check', () => {
    // Their role position may not reflect that they outrank everyone.
    expect(canTargetMember({ ...base, targetTopRole: 99, botTopRole: 100, actorIsOwner: true }).ok).toBe(true);
  });

  it('refuses when the BOT is below the target, and says how to fix it', () => {
    const r = canTargetMember({ ...base, botTopRole: 3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/above the bot/i);
  });

  it('checks the bot hierarchy even for the owner', () => {
    // Discord will reject it regardless of who asked, so we must too.
    expect(canTargetMember({ ...base, botTopRole: 1, actorIsOwner: true }).ok).toBe(false);
  });
});

describe('parseDuration', () => {
  it('reads minutes, hours and days', () => {
    expect(parseDuration('30m')).toEqual({ ok: true, minutes: 30 });
    expect(parseDuration('2h')).toEqual({ ok: true, minutes: 120 });
    expect(parseDuration('7d')).toEqual({ ok: true, minutes: 10_080 });
  });

  it('treats a bare number as minutes', () => {
    expect(parseDuration('45')).toEqual({ ok: true, minutes: 45 });
  });

  it('accepts spacing and long unit names', () => {
    expect(parseDuration(' 3 hours ')).toEqual({ ok: true, minutes: 180 });
    expect(parseDuration('2 DAYS')).toEqual({ ok: true, minutes: 2880 });
  });

  it('rejects nonsense rather than silently defaulting', () => {
    // A timeout that quietly became 1 minute instead of 1 day is worse than
    // an error message.
    expect(parseDuration('soon').ok).toBe(false);
    expect(parseDuration('').ok).toBe(false);
    expect(parseDuration('-5m').ok).toBe(false);
    expect(parseDuration('0h').ok).toBe(false);
  });

  it("rejects durations past Discord's 28-day maximum", () => {
    expect(parseDuration('29d').ok).toBe(false);
    expect(parseDuration('28d')).toEqual({ ok: true, minutes: MAX_TIMEOUT_MINUTES });
  });
});
