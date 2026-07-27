import { describe, expect, it } from 'vitest';
import { nextResetUnix } from './index.js';

describe('nextResetUnix', () => {
  it('returns a future time within 24h', () => {
    const now = new Date('2026-07-27T10:00:00Z');
    const unix = nextResetUnix(now, 17, 'America/Los_Angeles');
    const delta = unix - Math.floor(now.getTime() / 1000);
    expect(delta).toBeGreaterThan(0);
    expect(delta).toBeLessThanOrEqual(24 * 3600);
  });

  it('lands exactly on the reset hour in the target timezone', () => {
    const now = new Date('2026-07-27T10:00:00Z');
    const unix = nextResetUnix(now, 17, 'America/Los_Angeles');
    const local = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(new Date(unix * 1000));
    expect(local).toBe('17:00');
  });
});
